import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

const VALID_PAYMENT_METHODS = ['baridimob', 'ccp', 'bank_card', 'wallet', 'card'];

// ═══════════════════════════════════════════════════════════════
// POST /api/payments/create — Create a payment record
// ═══════════════════════════════════════════════════════════════
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

  // Resolve and validate payment method
  const resolvedMethod = body.method ?? 'card';
  if (!VALID_PAYMENT_METHODS.includes(resolvedMethod)) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: `Invalid payment method. Allowed: ${VALID_PAYMENT_METHODS.join(', ')}`,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // If booking_id is provided, verify ownership
  if (body.booking_id) {
    const booking = await db.booking.findUnique({
      where: { id: body.booking_id },
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
      bookingId: body.booking_id ?? null,
      amount: body.amount,
      method: resolvedMethod,
      status: 'pending',
      escrowStatus: body.escrow_status ?? null,
      requires3DSecure: resolvedMethod === 'card' || resolvedMethod === 'bank_card',
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
  } catch (error) {
    console.error('[Payments API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}