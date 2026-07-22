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
// GET /api/contracts/[id] — Get a single contract
// ═══════════════════════════════════════════════════════════════
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const { id } = await params;
  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      booking: {
        select: {
          id: true, userId: true, productName: true, productImage: true,
          startDate: true, endDate: true, totalPrice: true,
        },
      },
    },
  });

  if (!contract || contract.booking?.userId !== session.userId) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Contract not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  const data = {
    id: contract.id,
    booking_id: contract.bookingId,
    status: contract.status,
    is_finalized: contract.isFinalized,
    contract_hash: contract.contractHash,
    terms: contract.terms,
    parties: safeJsonParse(contract.parties, []),
    renter_signature: contract.renterSignature,
    signed_at: contract.signedAt?.toISOString() ?? null,
    snapshot: safeJsonParse(contract.snapshot, null),
    created_at: contract.createdAt.toISOString(),
    updated_at: contract.updatedAt.toISOString(),
    booking: contract.booking
      ? {
          id: contract.booking.id,
          user_id: contract.booking.userId,
          product_name: contract.booking.productName,
          product_image: contract.booking.productImage,
          start_date: contract.booking.startDate,
          end_date: contract.booking.endDate,
          total_price: contract.booking.totalPrice,
        }
      : null,
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data });
  } catch (error) {
    console.error('[Contracts API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}
