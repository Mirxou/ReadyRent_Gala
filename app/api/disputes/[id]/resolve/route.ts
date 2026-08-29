import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// POST /api/disputes/[id]/resolve — Admin/staff resolves a dispute
// SECURITY: Admin/staff only. Updates dispute status + creates system message
// ═══════════════════════════════════════════════════════════════

const VALID_RESOLUTIONS = ['approved', 'rejected'] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // Admin/staff only
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (currentUser?.role !== 'admin' && currentUser?.role !== 'staff') {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Admin or staff only', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            product: { select: { vendorId: true, name: true, nameAr: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Dispute not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate dispute is in a resolvable state
    const resolvableStatuses = ['filed', 'under_review', 'mediation', 'appealed'];
    if (!resolvableStatuses.includes(dispute.status)) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: `Cannot resolve dispute with status "${dispute.status}"`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { resolution, decision_note } = body;

    if (!resolution || !VALID_RESOLUTIONS.includes(resolution)) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Resolution must be "approved" or "rejected"', code: 'INVALID_RESOLUTION' },
        { status: 400 }
      );
    }

    const previousStatus = dispute.status;
    const newStatus = 'resolved';

    // Update dispute + create system messages in transaction
    await db.$transaction([
      db.dispute.update({
        where: { id },
        data: { status: newStatus },
      }),
      db.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: session.userId,
          type: 'system',
          message: `تم الفصل في النزاع: ${resolution === 'approved' ? 'مقبول' : 'مرفوض'}.${decision_note ? ` السبب: ${decision_note}` : ''}`,
        },
      }),
      db.disputeMessage.create({
        data: {
          disputeId: id,
          type: 'system',
          message: `تم تغيير حالة النزاع من "${previousStatus}" إلى "${newStatus}"`,
        },
      }),
    ]);

    // Notify dispute owner
    if (dispute.userId) {
      await db.notification.create({
        data: {
          userId: dispute.userId,
          type: 'system',
          title: resolution === 'approved' ? 'تم قبول نزاعك' : 'تم رفض نزاعك',
          message: `تم الفصل في نزاعك${dispute.title ? ` "${dispute.title}"` : ''} — ${resolution === 'approved' ? 'مقبول' : 'مرفوض'}.${decision_note ? ` السبب: ${decision_note}` : ''}`,
        },
      });
    }

    // Notify vendor
    const vendorId = dispute.booking?.product?.vendorId;
    if (vendorId && vendorId !== dispute.userId) {
      await db.notification.create({
        data: {
          userId: vendorId,
          type: 'system',
          title: resolution === 'approved' ? 'تم قبول نزاع ضد حجزك' : 'تم رفض نزاع ضد حجزك',
          message: `تم الفصل في النزاع${dispute.title ? ` "${dispute.title}"` : ''} — ${resolution === 'approved' ? 'مقبول' : 'مرفوض'}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        dispute_id: id,
        previous_status: previousStatus,
        new_status: newStatus,
        resolution,
      },
    });
  } catch (error) {
    logger.error('Dispute Resolve API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}