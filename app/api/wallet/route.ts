import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/wallet — Wallet balance (available + escrow split)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { walletBalance: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'User not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const totalWallet = user.walletBalance ?? 0;

  // Calculate escrow amount: sum of booking prices where escrow is 'held'
  const heldBookings = await db.booking.findMany({
    where: { userId: session.userId, escrowStatus: 'held' },
    select: { totalPrice: true },
  });
  const escrowHeld = heldBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const data = {
    available: totalWallet,
    escrow: escrowHeld,
    total: totalWallet + escrowHeld,
    currency: 'DZD',
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data });
  } catch (error) {
    logger.error('Wallet API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}
