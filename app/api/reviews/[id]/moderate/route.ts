import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// PATCH /api/reviews/[id]/moderate — Moderate a review (approve/reject)
// Admin or product vendor/owner only
// ═══════════════════════════════════════════════════════════════

const VALID_STATUSES = ['approved', 'rejected'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    // Get review with product info
    const review = await db.review.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, nameAr: true, name: true, vendorId: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'التقييم غير موجود',
          message_en: 'Review not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Authorization: admin/staff OR product vendor owner
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';
    const isVendorOwner = currentUser?.role === 'vendor' && review.product?.vendorId
      ? await db.user.findFirst({
          where: {
            id: session.userId,
            role: 'vendor',
          },
        }).then(() => true)
      : false;

    if (!isAdmin && !isVendorOwner) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح بتعديل هذا التقييم',
          message_en: 'Not authorized to moderate this review',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Validate body
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الحالة يجب أن تكون "approved" أو "rejected"',
          message_en: 'Status must be "approved" or "rejected"',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Update review
    const updated = await db.review.update({
      where: { id },
      data: { status },
    });

    // Create notification for the review author
    const productName = review.product?.nameAr || review.product?.name || 'منتج';
    const statusLabel = status === 'approved' ? 'تمت الموافقة' : 'تم الرفض';

    await db.notification.create({
      data: {
        userId: review.userId,
        type: 'system',
        title: `تحديث حالة تقييمك على "${productName}"`,
        message: `${statusLabel} — تقييمك على "${productName}" ${status === 'approved' ? 'تم نشره' : 'لم يتم نشره'}`,
      },
    });

    const data = {
      id: updated.id,
      status: updated.status,
      updated_at: updated.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data });
  } catch (error) {
    console.error('[Review Moderate API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء تعديل التقييم',
        message_en: 'An error occurred while moderating the review',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}