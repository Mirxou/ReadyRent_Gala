import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// PATCH /api/bookings/[id]/status — Transition booking status
// Allowed transitions:
//   pending   → confirmed  (after payment)
//   confirmed → active     (rental period started)
//   active    → completed  (rental period ended)
//   (cancellation is handled by /cancel route)
// ═══════════════════════════════════════════════════════════════

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed'],
  confirmed: ['active'],
  active: ['completed'],
};

const STATUS_LABELS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  active: 'نشط',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    // Get booking with user info for authorization
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, nameAr: true } },
        user: { select: { id: true, role: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الحجز غير موجود',
          message_en: 'Booking not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Authorization: must be booking owner OR admin/staff
    const isOwner = booking.userId === session.userId;
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح بتعديل حالة هذا الحجز',
          message_en: 'Not authorized to update this booking status',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();
    const newStatus = body.status;

    if (!newStatus) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'حقل status مطلوب',
          message_en: 'status field is required',
          code: 'MISSING_STATUS',
        },
        { status: 400 }
      );
    }

    // Reject cancellation through this route
    if (newStatus === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لإلغاء الحجز، يرجى استخدام مسار الإلغاء المخصص',
          message_en: 'Use the dedicated cancel route to cancel a booking',
          code: 'USE_CANCEL_ROUTE',
        },
        { status: 400 }
      );
    }

    // Validate the transition
    const currentStatus = booking.status;
    const allowedTargets = VALID_TRANSITIONS[currentStatus];

    if (!allowedTargets || !allowedTargets.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `لا يمكن الانتقال من "${STATUS_LABELS_AR[currentStatus] || currentStatus}" إلى "${STATUS_LABELS_AR[newStatus] || newStatus}"`,
          message_en: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
          code: 'INVALID_TRANSITION',
        },
        { status: 400 }
      );
    }

    // Update booking status
    const updated = await db.booking.update({
      where: { id },
      data: { status: newStatus },
    });

    // Create notification for the booking owner
    const productName = booking.productName || booking.product?.nameAr || booking.product?.name || 'حجز';
    const statusLabel = STATUS_LABELS_AR[newStatus] || newStatus;

    await db.notification.create({
      data: {
        userId: booking.userId!,
        type: 'booking',
        title: 'تحديث حالة الحجز',
        message: `تم تحديث حالة حجز "${productName}" إلى "${statusLabel}"`,
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: updated.id,
        status: updated.status,
        previous_status: currentStatus,
        new_status: newStatus,
        updated_at: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Booking Status API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء تحديث حالة الحجز',
        message_en: 'An error occurred while updating booking status',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}