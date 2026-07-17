import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/wallet/deposit — Deposit to wallet
//
// SECURITY NOTE: This is a demo/sandbox application. In production,
// deposits must be verified against a real payment gateway (e.g.,
// Stripe, PayPal) before crediting the wallet. This route
// currently accepts self-reported amounts without payment proof.
// ═══════════════════════════════════════════════════════════════

const MAX_DEPOSIT_PER_TRANSACTION = 100000;
const MAX_DEPOSIT_PER_DAY = 500000;

// In-memory daily deposit tracking (resets on server restart)
const dailyDeposits = new Map<string, { date: string; total: number }>();

function getDailyTotal(userId: string): number {
  const today = new Date().toISOString().split('T')[0];
  const record = dailyDeposits.get(userId);
  if (!record || record.date !== today) return 0;
  return record.total;
}

function addDailyDeposit(userId: string, amount: number): void {
  const today = new Date().toISOString().split('T')[0];
  const record = dailyDeposits.get(userId);
  if (!record || record.date !== today) {
    dailyDeposits.set(userId, { date: today, total: amount });
  } else {
    record.total += amount;
  }
}

export async function POST(request: Request) {
  try {
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

  // Per-transaction limit
  if (body.amount > MAX_DEPOSIT_PER_TRANSACTION) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: `Maximum deposit per transaction is ${MAX_DEPOSIT_PER_TRANSACTION}`,
        code: 'DEPOSIT_LIMIT_EXCEEDED',
      },
      { status: 400 }
    );
  }

  // Daily deposit limit
  const currentDailyTotal = getDailyTotal(session.userId);
  if (currentDailyTotal + body.amount > MAX_DEPOSIT_PER_DAY) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: `Daily deposit limit of ${MAX_DEPOSIT_PER_DAY} would be exceeded`,
        code: 'DAILY_DEPOSIT_LIMIT_EXCEEDED',
      },
      { status: 400 }
    );
  }

  // Create transaction & update balance in a single Prisma transaction
  const [user, transaction] = await db.$transaction([
    db.user.update({
      where: { id: session.userId },
      data: { walletBalance: { increment: body.amount } },
      select: { walletBalance: true },
    }),
    db.transaction.create({
      data: {
        userId: session.userId,
        type: 'DEPOSIT',
        amount: body.amount,
        note: body.method ?? 'wallet_deposit',
      },
    }),
  ]);

  // Track daily deposit
  addDailyDeposit(session.userId, body.amount);

  const data = {
    balance: user.walletBalance,
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
  } catch (error) {
    console.error('[Wallet Deposit API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}