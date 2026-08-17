import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { checkWalletRateLimit } from '@/lib/rate-limiter';
import { walletDepositSchema, validateBody } from '@/lib/validators';

// ═══════════════════════════════════════════════════════════════
// POST /api/wallet/deposit — Deposit to wallet
// SECURITY: Non-admin deposits REQUIRE a payment reference.
// Only admin_topup method bypasses this (for testing/manual topups).
// ═══════════════════════════════════════════════════════════════

const MAX_DEPOSIT_PER_DAY = 500000;

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // ── Rate limiting: 20 deposits per minute per user ──
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

    const { amount, method, reference } = vResult.data;
    const resolvedMethod = method ?? 'baridimob';

    // ── SECURITY: Non-admin deposits must have a payment reference ──
    // This prevents users from self-reporting deposits without actual payment
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    const isAdmin = user?.role === 'admin' || user?.role === 'staff';

    if (resolvedMethod !== 'admin_topup') {
      if (!reference || reference.length < 6) {
        return NextResponse.json(
          {
            success: false,
            dignity_preserved: true,
            message_ar: 'يجب توفير رقم مرجع الدفع من بوابة الدفع',
            message_en: 'Payment reference number is required for deposits',
            code: 'PAYMENT_REFERENCE_REQUIRED',
          },
          { status: 400 }
        );
      }
    } else if (!isAdmin) {
      // Only admin/staff can use admin_topup
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_en: 'Unauthorized deposit method',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Daily deposit limit
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

    // Create transaction & update balance atomically
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
          note: `إيداع عبر ${resolvedMethod}${reference ? ` — مرجع: ${reference}` : ''}`,
          hash: txHash,
        },
      }),
    ]);

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
