import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/contracts — List user's contracts
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  // Find contracts through the user's bookings
  const contracts = await db.contract.findMany({
    where: {
      booking: { userId: session.userId },
    },
    include: {
      booking: {
        select: {
          id: true, productName: true, productImage: true,
          startDate: true, endDate: true, totalPrice: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = contracts.map((c) => ({
    id: c.id,
    booking_id: c.bookingId,
    status: c.status,
    is_finalized: c.isFinalized,
    contract_hash: c.contractHash,
    terms: c.terms,
    parties: c.parties ? JSON.parse(c.parties) : [],
    renter_signature: c.renterSignature,
    signed_at: c.signedAt?.toISOString() ?? null,
    snapshot: c.snapshot ? JSON.parse(c.snapshot) : null,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
    booking: c.booking
      ? {
          id: c.booking.id,
          product_name: c.booking.productName,
          product_image: c.booking.productImage,
          start_date: c.booking.startDate,
          end_date: c.booking.endDate,
          total_price: c.booking.totalPrice,
        }
      : null,
  }));

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}