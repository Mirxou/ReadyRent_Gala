import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/bookings/[id]/cancellation-policy — Cancellation policy
// ═══════════════════════════════════════════════════════════════
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;
    const booking = await db.booking.findUnique({
      where: { id },
      select: { userId: true, startDate: true, totalPrice: true, status: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message_en: 'Booking not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    if (booking.userId !== session.userId) {
      const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
      if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
      }
    }

    // Can only cancel pending or confirmed bookings
    let canCancel = booking.status === 'pending' || booking.status === 'confirmed';

    // Calculate refund percentage based on hours until start
    const startDate = new Date(booking.startDate as string | Date);
    const hoursUntilStart = (startDate.getTime() - Date.now()) / (1000 * 60 * 60);
    let refundPercentage = 0;
    let policyMessage = '';

    if (hoursUntilStart > 48) {
      refundPercentage = 100;
      policyMessage = 'يمكنك الإلغاء واسترداد المبلغ كاملاً (أكثر من 48 ساعة قبل موعد الاستلام)';
    } else if (hoursUntilStart > 24) {
      refundPercentage = 50;
      policyMessage = 'يمكنك الإلغاء واسترداد 50% من المبلغ (24-48 ساعة قبل موعد الاستلام)';
    } else if (hoursUntilStart > 0) {
      refundPercentage = 0;
      policyMessage = 'لا يمكن استرداد المبلغ (أقل من 24 ساعة قبل موعد الاستلام)';
    } else {
      refundPercentage = 0;
      policyMessage = 'لا يمكن الإلغاء بعد موعد الاستلام';
      canCancel = false;
    }

    const refundAmount = (booking.totalPrice * refundPercentage) / 100;

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        policy: policyMessage,
        refund_percentage: refundPercentage,
        refund_amount: refundAmount,
        total_price: booking.totalPrice,
        can_cancel: canCancel,
        hours_until_start: Math.max(0, Math.round(hoursUntilStart)),
        booking_status: booking.status,
      },
    });
  } catch (error) {
    console.error('[Cancellation Policy API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error fetching cancellation policy', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}