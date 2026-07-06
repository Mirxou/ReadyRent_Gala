import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/payments/payments — List user's payments
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const payments = await db.payment.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  const data = payments.map((p) => ({
    id: p.id,
    user_id: p.userId,
    booking_id: p.bookingId,
    amount: p.amount,
    method: p.method,
    status: p.status,
    escrow_status: p.escrowStatus,
    requires_3d_secure: p.requires3DSecure,
    redirect_url: p.redirectUrl,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  }));

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}