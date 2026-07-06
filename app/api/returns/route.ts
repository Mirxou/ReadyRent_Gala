import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/returns — List user's return requests
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const returns = await db.returnRequest.findMany({
    where: { userId: session.userId },
    include: {
      booking: {
        select: {
          id: true, productName: true, productImage: true,
          totalPrice: true, status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = returns.map((r) => ({
    id: r.id,
    user_id: r.userId,
    booking_id: r.bookingId,
    booking_ref: r.bookingRef,
    reason: r.reason,
    description: r.description,
    status: r.status,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
    booking: r.booking
      ? {
          id: r.booking.id,
          product_name: r.booking.productName,
          product_image: r.booking.productImage,
          total_price: r.booking.totalPrice,
          status: r.booking.status,
        }
      : null,
  }));

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}