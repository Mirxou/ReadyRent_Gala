import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/wallet/withdraw — Withdraw from wallet
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const body = await request.json();

  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'A valid positive amount is required',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Check balance
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { walletBalance: true },
  });

  if (!user || user.walletBalance < body.amount) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Insufficient wallet balance',
        code: 'INSUFFICIENT_BALANCE',
      },
      { status: 400 }
    );
  }

  // Create transaction & update balance atomically
  const [updatedUser, transaction] = await db.$transaction([
    db.user.update({
      where: { id: session.userId },
      data: { walletBalance: { decrement: body.amount } },
      select: { walletBalance: true },
    }),
    db.transaction.create({
      data: {
        userId: session.userId,
        type: 'WITHDRAWAL',
        amount: body.amount,
        note: 'wallet_withdrawal',
      },
    }),
  ]);

  const data = {
    balance: updatedUser.walletBalance,
    transaction: {
      id: transaction.id,
      user_id: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      note: transaction.note,
      hash: transaction.hash,
      created_at: transaction.createdAt.toISOString(),
    },
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
}