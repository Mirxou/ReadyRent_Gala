import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { createPaymentSchema, validateBody } from '@/lib/validators';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// POST /api/payments/create — Create a payment record
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const body = await request.json();

  // ── Zod validation ──
  const vResult = validateBody(createPaymentSchema, body);
  if (!vResult.success) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: vResult.message, message_en: vResult.message, code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const resolvedMethod = vResult.data.method;

  // If booking_id is provided, verify ownership
  if (vResult.data.booking_id) {
    const booking = await db.booking.findUnique({
      where: { id: vResult.data.booking_id },
      select: { userId: true },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_en: 'Booking not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (booking.userId !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_en: 'You can only create payments for your own bookings',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
  }

  const payment = await db.payment.create({
    data: {
      userId: session.userId,
      bookingId: vResult.data.booking_id ?? null,
      amount: vResult.data.amount,
      method: resolvedMethod,
      status: 'pending',
      escrowStatus: vResult.data.escrow_status ?? null,
      requires3DSecure: resolvedMethod === 'card' || resolvedMethod === 'bank_card',
      redirectUrl: vResult.data.redirect_url ?? null,
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
  } catch (error) {
    logger.error('Payments API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}