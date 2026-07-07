import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/wallet — Wallet balance & recent transactions
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { walletBalance: true },
  });

  const balance = user?.walletBalance ?? 0;

  const transactions = await db.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const data = {
    balance,
    transactions: transactions.map((t) => ({
      id: t.id,
      user_id: t.userId,
      type: t.type,
      amount: t.amount,
      note: t.note,
      hash: t.hash,
      created_at: t.createdAt.toISOString(),
    })),
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}