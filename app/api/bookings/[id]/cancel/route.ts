import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/bookings/[id]/cancel — Cancel a booking with refund logic
// ═══════════════════════════════════════════════════════════════
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    // Get booking
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

    // Check authorization: must be booking owner OR admin
    const isOwner = booking.userId === session.userId;
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = user?.role === 'admin' || user?.role === 'staff';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح بإلغاء هذا الحجز',
          message_en: 'Not authorized to cancel this booking',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Only allow cancel if status is pending or confirmed
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `لا يمكن إلغاء حجز بحالة "${booking.status}"`,
          message_en: `Cannot cancel a booking with status "${booking.status}"`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Calculate refund based on 48h rule
    let refundAmount = booking.totalPrice;
    let refundPercent = 100;

    if (booking.startDate) {
      const startMs = new Date(booking.startDate).getTime();
      const nowMs = Date.now();
      const hoursUntilStart = (startMs - nowMs) / (1000 * 60 * 60);

      if (hoursUntilStart < 48) {
        // Less than 48 hours before start: 50% refund
        refundAmount = Math.floor(booking.totalPrice / 2);
        refundPercent = 50;
      }
    }

    const productName = booking.productName || booking.product?.nameAr || booking.product?.name || 'حجز';

    // Perform cancellation with refund in a transaction
    await db.$transaction([
      // Update booking status
      db.booking.update({
        where: { id },
        data: { status: 'cancelled' },
      }),
      // Refund to wallet (only if there's an amount to refund)
      ...(refundAmount > 0
        ? [
            db.user.update({
              where: { id: booking.userId! },
              data: { walletBalance: { increment: refundAmount } },
            }),
            db.transaction.create({
              data: {
                userId: booking.userId!,
                type: 'INCOME',
                amount: refundAmount,
                note: `استرداد إلغاء حجز "${productName}" — ${refundPercent}%`,
              },
            }),
          ]
        : []),
    ]);

    // Create notification for the user
    await db.notification.create({
      data: {
        userId: booking.userId!,
        type: 'booking',
        title: 'تم إلغاء الحجز',
        message: `تم إلغاء حجز "${productName}". مبلغ الاسترداد: ${refundAmount} د.ج (${refundPercent}%)`,
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: booking.id,
        status: 'cancelled',
        refund_amount: refundAmount,
        refund_percent: refundPercent,
        message:
          refundPercent === 100
            ? 'تم إلغاء الحجز واسترداد المبلغ كاملاً'
            : 'تم إلغاء الحجز واسترداد 50% من المبلغ',
      },
    });
  } catch (error) {
    console.error('[Booking Cancel API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء إلغاء الحجز',
        message_en: 'An error occurred while cancelling the booking',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}