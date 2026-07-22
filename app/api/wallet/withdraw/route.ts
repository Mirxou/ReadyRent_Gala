import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/wallet/withdraw — Withdraw from wallet
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const body = await request.json();

  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0 || !Number.isInteger(body.amount)) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'A valid positive integer amount is required',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Use interactive transaction to atomically check balance and decrement
  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: session.userId },
      select: { walletBalance: true },
    });

    if (!user || (user.walletBalance ?? 0) < body.amount) {
      return { error: 'INSUFFICIENT_BALANCE' } as const;
    }

    const updatedUser = await tx.user.update({
      where: { id: session.userId },
      data: { walletBalance: { decrement: body.amount } },
      select: { walletBalance: true },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId: session.userId,
        type: 'WITHDRAWAL',
        amount: body.amount,
        note: body.note || 'wallet_withdrawal',
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
      user_id: result.transaction.userId,
      type: result.transaction.type,
      amount: result.transaction.amount,
      note: result.transaction.note,
      hash: result.transaction.hash,
      created_at: result.transaction.createdAt.toISOString(),
    },
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
  } catch (error) {
    console.error('[Wallet Withdraw API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}