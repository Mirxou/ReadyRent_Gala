import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// POST /api/disputes/[id]/messages — Add a message to a dispute
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    // Get dispute with booking info
    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            product: { select: { id: true, nameAr: true, vendorId: true } },
          },
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

    // Authorization: dispute owner, vendor, or admin/staff
    const isOwner = dispute.userId === session.userId;
    const isVendor = dispute.booking?.product?.vendorId === session.userId;
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

    if (!isOwner && !isVendor && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح بإضافة رسالة إلى هذا النزاع',
          message_en: 'Not authorized to add a message to this dispute',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Validate body
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'محتوى الرسالة مطلوب',
          message_en: 'Message content is required',
          code: 'MISSING_CONTENT',
        },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الرسالة طويلة جداً (الحد الأقصى 5000 حرف)',
          message_en: 'Message is too long (max 5000 characters)',
          code: 'CONTENT_TOO_LONG',
        },
        { status: 400 }
      );
    }

    // Determine if dispute status needs updating
    const needsReviewUpdate = dispute.status === 'filed';
    const updateData: Record<string, unknown> = {};
    if (needsReviewUpdate) {
      updateData.status = 'under_review';
    }

    // Create message and optionally update dispute status
    const [message] = await db.$transaction([
      db.disputeMessage.create({
        data: {
          disputeId: id,
          senderId: session.userId,
          type: 'message',
          message: content.trim(),
        },
      }),
      ...(needsReviewUpdate
        ? [
            db.dispute.update({
              where: { id },
              data: updateData,
            }),
          ]
        : []),
    ]);

    // Notify the other party(ies)
    const notificationRecipients: string[] = [];
    if (isVendor) {
      // Vendor sent message → notify dispute owner
      if (dispute.userId && dispute.userId !== session.userId) {
        notificationRecipients.push(dispute.userId);
      }
    } else if (isOwner) {
      // Dispute owner sent message → notify vendor
      if (dispute.bookingId) {
        const bookingForVendor = await db.booking.findUnique({
          where: { id: dispute.bookingId },
          select: { product: { select: { vendorId: true } } },
        });
        if (bookingForVendor?.product?.vendorId) {
          notificationRecipients.push(bookingForVendor.product.vendorId);
        }
      }
    } else if (isAdmin) {
      // Admin sent message → notify both parties
      if (dispute.userId) notificationRecipients.push(dispute.userId);
      if (dispute.bookingId) {
        const bookingForVendor = await db.booking.findUnique({
          where: { id: dispute.bookingId },
          select: { product: { select: { vendorId: true } } },
        });
        if (bookingForVendor?.product?.vendorId && !notificationRecipients.includes(bookingForVendor.product.vendorId)) {
          notificationRecipients.push(bookingForVendor.product.vendorId);
        }
      }
    }

    for (const recipientId of notificationRecipients) {
      await db.notification.create({
        data: {
          userId: recipientId,
          type: 'system',
          title: 'رسالة جديدة في النزاع',
          message: `تم إضافة رسالة جديدة في نزاع${dispute.title ? ` "${dispute.title}"` : ''}`,
        },
      });
    }

    const data = {
      id: message.id,
      dispute_id: message.disputeId,
      sender_id: message.senderId,
      type: message.type,
      message: message.message,
      created_at: message.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Dispute Message API', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء إرسال الرسالة',
        message_en: 'An error occurred while sending the message',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}