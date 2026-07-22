import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /api/contracts — List user's contracts
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
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
    parties: safeJsonParse(c.parties, []),
    renter_signature: c.renterSignature,
    signed_at: c.signedAt?.toISOString() ?? null,
    snapshot: safeJsonParse(c.snapshot, null),
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
  } catch (error) {
    console.error('[Contracts API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}