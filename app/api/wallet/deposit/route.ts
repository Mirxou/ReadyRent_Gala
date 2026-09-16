import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { checkWalletRateLimit } from '@/lib/rate-limiter';
import { walletDepositSchema, validateBody } from '@/lib/validators';

// ═══════════════════════════════════════════════════════════════
// POST /api/wallet/deposit — Deposit to wallet
// P0-6 SECURITY FIX: this route previously accepted any 6-char `reference`
// string from any authenticated user and immediately credited the wallet.
// That allowed any user to inflate their balance by up to 500,000 DZD/day
// by simply providing an arbitrary reference number with no verification
// against any payment provider.
//
// NEW behaviour:
//   - `admin_topup` (admin/staff only): unchanged — admin credits wallet
//     manually after confirming offline payment
//   - `baridimob` / `ccp` / `bank_card` from non-admin: REJECTED with
//     403 + clear message. These methods must go through Chargily checkout
//     → webhook reconciliation (TODO: implement /api/wallet/deposit/initiate
//     that creates a Chargily checkout and lets the webhook credit the
//     wallet on `checkout.paid`).
//
// This is a temporary lockdown until the Chargily-initiated deposit flow
// ships. The 500,000 DZD/day self-inflation vulnerability is closed.
// ═══════════════════════════════════════════════════════════════

const MAX_DEPOSIT_PER_DAY = 500000;

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // ── Rate limiting: 20 wallet operations per minute per user ──
    const rateCheck = checkWalletRateLimit(session.userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_en: 'Too many wallet operations. Please wait.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // ── Zod validation ──
    const vResult = validateBody(walletDepositSchema, body);
    if (!vResult.success) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: vResult.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { amount, method } = vResult.data;
    const resolvedMethod = method ?? 'baridimob';

    // ── Fetch user role ──
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    const isAdmin = user?.role === 'admin' || user?.role === 'staff';

    // ── P0-6 fix: lockdown non-admin deposits ──
    if (resolvedMethod === 'admin_topup') {
      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            dignity_preserved: true,
            message_ar: 'طريقة الإيداع غير مصرّح بها',
            message_en: 'Unauthorized deposit method',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
      // admin_topup proceeds below — no reference required
    } else {
      // Non-admin deposits via baridimob/ccp/bank_card are suspended until
      // the Chargily-initiated deposit flow is implemented. Refuse with
      // a clear message and link to the (future) initiate route.
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الإيداع الذاتي عبر BaridiMob/CCP/BankCard معطّل مؤقتاً. يرجى التواصل مع الإدارة أو استخدام بوابة Chargily عند توفرها.',
          message_en: 'Self-service deposits via BaridiMob/CCP/BankCard are temporarily disabled. Please contact support or use the Chargily gateway once available.',
          code: 'DEPOSIT_METHOD_UNAVAILABLE',
        },
        { status: 403 }
      );
    }

    // ── Daily deposit limit ──
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayDeposits = await db.transaction.aggregate({
      where: {
        userId: session.userId,
        type: 'DEPOSIT',
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    });

    const currentDailyTotal = todayDeposits._sum.amount ?? 0;
    if (currentDailyTotal + amount > MAX_DEPOSIT_PER_DAY) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_en: `Daily deposit limit of ${MAX_DEPOSIT_PER_DAY} DA would be exceeded`,
          code: 'DAILY_DEPOSIT_LIMIT_EXCEEDED',
        },
        { status: 400 }
      );
    }

    // ── Create transaction & update balance atomically ──
    const txHash = `dep_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const [updatedUser, transaction] = await db.$transaction([
      db.user.update({
        where: { id: session.userId },
        data: { walletBalance: { increment: amount } },
        select: { walletBalance: true },
      }),
      db.transaction.create({
        data: {
          userId: session.userId,
          type: 'DEPOSIT',
          amount,
          note: `إيداع بواسطة ${user?.role} (${resolvedMethod})`,
          hash: txHash,
        },
      }),
    ]);

    // ── Log admin action for audit trail ──
    if (isAdmin) {
      await db.activityLog.create({
        data: {
          userId: session.userId,
          action: 'admin_topup',
          target: session.userId,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        },
      }).catch((e: unknown) => {
        logger.error('Wallet Deposit', 'Failed to write admin audit log', e);
      });
    }

    const data = {
      balance: updatedUser.walletBalance,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        note: transaction.note,
        hash: transaction.hash,
        created_at: transaction.createdAt.toISOString(),
      },
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Wallet Deposit', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}
