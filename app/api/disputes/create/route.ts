import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { createDisputeSchema, validateBody } from '@/lib/validators';

// ═══════════════════════════════════════════════════════════════
// POST /api/disputes/create — Create a dispute
// SECURITY: Zod validated, prevents duplicates, caps claimed amount
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();

    // ── Zod validation ──
    const vResult = validateBody(createDisputeSchema, body);
    if (!vResult.success) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: vResult.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { booking_id, title, reason, description, claim_type, claimed_amount, evidence_urls } = vResult.data;

    // Verify the booking belongs to the user (renter OR vendor for counter-claim)
    const booking = await db.booking.findUnique({
      where: { id: booking_id },
      select: { userId: true, productId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Booking not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Vendor protection: check if user is the vendor (product owner) → counter-claim allowed
    const product = await db.product.findUnique({
      where: { id: booking.productId },
      select: { vendorId: true },
    });

    const isVendor = product?.vendorId === session.userId;
    const isRenter = booking.userId === session.userId;

    if (!isRenter && !isVendor) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Not authorized to dispute this booking', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // ── Duplicate prevention: only one active dispute per booking per role ──
    const existingDispute = await db.dispute.findFirst({
      where: {
        bookingId: booking_id,
        status: { in: ['filed', 'under_review', 'mediation', 'hearing', 'appealed'] },
        userId: session.userId,
      },
    });

    if (existingDispute) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لديك نزاع نشط بالفعل على هذا الحجز',
          message_en: 'You already have an active dispute for this booking',
          code: 'DUPLICATE_DISPUTE',
        },
        { status: 409 }
      );
    }

    const dispute = await db.dispute.create({
      data: {
        userId: session.userId,
        bookingId: booking_id,
        title,
        description: description ?? reason,
        claimType: claim_type,
        status: 'filed',
        priority: claimed_amount && claimed_amount > 50000 ? 'high' : 'medium',
        claimedAmount: claimed_amount ?? 0,
        evidenceUrls: evidence_urls ? JSON.stringify(evidence_urls) : '[]',
      },
    });

    // Notify the other party
    const otherPartyId = isRenter ? product?.vendorId : booking.userId;
    if (otherPartyId) {
      await db.notification.create({
        data: {
          userId: otherPartyId,
          type: 'legal',
          title: 'نزاع جديد على حجزك',
          message: `تم فتح نزاع بعنوان "${title}" على أحد حجوزاتك. يرجى مراجعة التفاصيل والرد خلال 48 ساعة.`,
        },
      });
    }

    const data = {
      id: dispute.id,
      user_id: dispute.userId,
      booking_id: dispute.bookingId,
      title: dispute.title,
      claim_type: dispute.claimType,
      status: dispute.status,
      priority: dispute.priority,
      claimed_amount: dispute.claimedAmount,
      evidence_urls: JSON.parse(dispute.evidenceUrls),
      created_at: dispute.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Disputes API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}
