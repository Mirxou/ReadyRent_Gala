import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/disputes/[id]/appeal — Appeal a dispute resolution
// Only the dispute owner can appeal
// ═══════════════════════════════════════════════════════════════

// Disputes can be appealed if they are in: resolved, closed
const APPEALABLE_STATUSES = ['resolved', 'closed'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    // Get dispute
    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          select: { id: true, productName: true, product: { select: { nameAr: true } } },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'النزاع غير موجود',
          message_en: 'Dispute not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Authorization: dispute owner ONLY
    if (dispute.userId !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'فقط صاحب النزاع يمكنه تقديم طعن',
          message_en: 'Only the dispute owner can file an appeal',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Validate dispute is in an appealable state
    if (!APPEALABLE_STATUSES.includes(dispute.status)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `لا يمكن الطعن في نزاع بحالة "${dispute.status}"`,
          message_en: `Cannot appeal a dispute with status "${dispute.status}"`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate body
    const body = await request.json();
    const { reason, description } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'سبب الطعن مطلوب',
          message_en: 'Appeal reason is required',
          code: 'MISSING_REASON',
        },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'وصف الطعن مطلوب',
          message_en: 'Appeal description is required',
          code: 'MISSING_DESCRIPTION',
        },
        { status: 400 }
      );
    }

    const previousStatus = dispute.status;

    // Create appeal message and update dispute status in a transaction
    const [appealMessage] = await db.$transaction([
      db.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: session.userId,
          type: 'appeal',
          message: `طعن — السبب: ${reason.trim()}\n${description.trim()}`,
        },
      }),
      db.dispute.update({
        where: { id },
        data: { status: 'appealed' },
      }),
      // System message about the status change
      db.disputeMessage.create({
        data: {
          disputeId: id,
          type: 'system',
          message: `تم تغيير حالة النزاع من "${previousStatus}" إلى "appealed"`,
        },
      }),
    ]);

    // Create notification for the dispute owner
    await db.notification.create({
      data: {
        userId: session.userId,
        type: 'system',
        title: 'تم تقديم الطعن بنجاح',
        message: `تم تقديم طعنك على النزاع "${dispute.title || ''}" وسيتم مراجعته من جديد`,
      },
    });

    const data = {
      id: appealMessage.id,
      dispute_id: id,
      type: 'appeal',
      previous_status: previousStatus,
      new_status: 'appealed',
      reason: reason.trim(),
      description: description.trim(),
      created_at: appealMessage.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
  } catch (error) {
    console.error('[Dispute Appeal API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء تقديم الطعن',
        message_en: 'An error occurred while filing the appeal',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}