import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/disputes — List user's disputes
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const disputes = await db.dispute.findMany({
    where: { userId: session.userId },
    include: {
      booking: {
        select: {
          id: true, productName: true, productImage: true, totalPrice: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = disputes.map((d) => ({
    id: d.id,
    user_id: d.userId,
    booking_id: d.bookingId,
    title: d.title,
    description: d.description,
    claim_type: d.claimType,
    status: d.status,
    priority: d.priority,
    claimed_amount: d.claimedAmount,
    evidence_urls: d.evidenceUrls ? JSON.parse(d.evidenceUrls) : [],
    created_at: d.createdAt.toISOString(),
    updated_at: d.updatedAt.toISOString(),
    booking: d.booking
      ? {
          id: d.booking.id,
          product_name: d.booking.productName,
          product_image: d.booking.productImage,
          total_price: d.booking.totalPrice,
        }
      : null,
  }));

  return NextResponse.json({ success: true, dignity_preserved: true, data });
  } catch (error) {
    console.error('[Disputes API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}