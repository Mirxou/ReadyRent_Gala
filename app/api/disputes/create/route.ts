import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/disputes/create — Create a dispute
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

  const dispute = await db.dispute.create({
    data: {
      userId: session.userId,
      bookingId: body.booking_id,
      title: body.title ?? null,
      description: body.description ?? null,
      claimType: body.claim_type ?? 'general',
      status: 'filed',
      priority: 'medium',
      claimedAmount: body.claimed_amount ?? 0,
      evidenceUrls: body.evidence_urls ? JSON.stringify(body.evidence_urls) : '[]',
    },
  });

  const data = {
    id: dispute.id,
    user_id: dispute.userId,
    booking_id: dispute.bookingId,
    title: dispute.title,
    description: dispute.description,
    claim_type: dispute.claimType,
    status: dispute.status,
    priority: dispute.priority,
    claimed_amount: dispute.claimedAmount,
    evidence_urls: JSON.parse(dispute.evidenceUrls),
    created_at: dispute.createdAt.toISOString(),
    updated_at: dispute.updatedAt.toISOString(),
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
}