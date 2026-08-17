import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { walletWithdrawSchema, validateBody } from '@/lib/validators';
import { checkWalletRateLimit } from '@/lib/rate-limiter';

// ═══════════════════════════════════════════════════════════════
// POST /api/wallet/withdraw — Withdraw from wallet
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // ── Rate limiting ──
    const rateCheck = checkWalletRateLimit(session.userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Too many wallet operations', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // ── Zod validation ──
    const vResult = validateBody(walletWithdrawSchema, body);
    if (!vResult.success) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: vResult.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { amount, method } = vResult.data;

    // Use interactive transaction to atomically check balance and decrement
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true },
      });

      if (!user || (user.walletBalance ?? 0) < amount) {
        return { error: 'INSUFFICIENT_BALANCE' } as const;
      }

      const updatedUser = await tx.user.update({
        where: { id: session.userId },
        data: { walletBalance: { decrement: amount } },
        select: { walletBalance: true },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: session.userId,
          type: 'WITHDRAWAL',
          amount,
          note: `سحب عبر ${method}`,
          hash: `wd_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      });

      return { updatedUser, transaction } as const;
    });

    if ('error' in result) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_en: 'Insufficient wallet balance',
          code: result.error,
        },
        { status: 400 }
      );
    }

    const data = {
      balance: result.updatedUser.walletBalance,
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        amount: result.transaction.amount,
        note: result.transaction.note,
        hash: result.transaction.hash,
        created_at: result.transaction.createdAt.toISOString(),
      },
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Wallet Withdraw', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}
