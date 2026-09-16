import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { walletWithdrawSchema, validateBody } from '@/lib/validators';
import { checkWalletRateLimit } from '@/lib/rate-limiter';

// ═══════════════════════════════════════════════════════════════
// POST /api/wallet/withdraw — Withdraw from wallet
// P1 fix: $transaction now uses isolationLevel Serializable so that two
// concurrent withdrawals can't both pass the balance check on a stale snapshot
// and result in a negative balance.
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
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

    // Use interactive transaction with SERIALIZABLE isolation to atomically
    // check balance and decrement (prevents two concurrent withdrawals from
    // both passing the check on a stale snapshot).
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
    }, {
      // P1 fix: Serializable prevents concurrent balance-check races.
      // NOTE: SQLite ignores this option (only one writer at a time anyway),
      // but PostgreSQL honours it. When the project migrates to PostgreSQL
      // (per schema.prisma comment) this becomes effective automatically.
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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
