import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/payments/create — Create a payment record
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

  const payment = await db.payment.create({
    data: {
      userId: session.userId,
      bookingId: body.booking_id ?? null,
      amount: body.amount,
      method: body.method ?? 'card',
      status: 'pending',
      escrowStatus: body.escrow_status ?? null,
      requires3DSecure: body.method === 'card',
      redirectUrl: body.redirect_url ?? null,
    },
  });

  const data = {
    id: payment.id,
    user_id: payment.userId,
    booking_id: payment.bookingId,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    escrow_status: payment.escrowStatus,
    requires_3d_secure: payment.requires3DSecure,
    redirect_url: payment.redirectUrl,
    created_at: payment.createdAt.toISOString(),
    updated_at: payment.updatedAt.toISOString(),
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
}