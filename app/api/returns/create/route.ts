import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/returns/create — Create a return request
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const body = await request.json();

  if (!body.booking_id) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'booking_id is required',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Verify the booking belongs to the user
  const booking = await db.booking.findUnique({
    where: { id: body.booking_id },
    select: { userId: true },
  });

  if (!booking || booking.userId !== session.userId) {
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

  const returnRequest = await db.returnRequest.create({
    data: {
      userId: session.userId,
      bookingId: body.booking_id,
      bookingRef: body.booking_ref ?? null,
      reason: body.reason ?? null,
      description: body.description ?? null,
      status: 'pending',
    },
  });

  const data = {
    id: returnRequest.id,
    user_id: returnRequest.userId,
    booking_id: returnRequest.bookingId,
    booking_ref: returnRequest.bookingRef,
    reason: returnRequest.reason,
    description: returnRequest.description,
    status: returnRequest.status,
    created_at: returnRequest.createdAt.toISOString(),
    updated_at: returnRequest.updatedAt.toISOString(),
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
}