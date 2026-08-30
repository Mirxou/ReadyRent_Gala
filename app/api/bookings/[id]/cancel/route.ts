import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════
// POST /api/bookings/[id]/cancel — Cancel a booking with escrow awareness
// ═══════════════════════════════════════════════════════════════
// Chargily Pay has NO refund API. If escrow was 'held' (money received),
// the real refund must be done manually via bank transfer.
// We track this obligation in RefundRecord (Law 18-05 Art. 22: 15-day deadline).
// ═══════════════════════════════════════════════════════════════

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const cancelReason = (body as Record<string, string>).reason || '';

    // Get booking with payment info
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, nameAr: true, vendorId: true } },
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

    // Only allow cancel if status is pending, confirmed, or active
    if (!['pending', 'confirmed', 'active'].includes(booking.status)) {
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

    // Calculate refund based on policy: ≥48h=100%, 24-48h=50%, <24h=0%
    let refundAmount = 0;
    let refundPercent = 0;

    if (booking.startDate) {
      const startMs = new Date(booking.startDate).getTime();
      const nowMs = Date.now();
      const hoursUntilStart = (startMs - nowMs) / (1000 * 60 * 60);

      if (hoursUntilStart >= 48) {
        refundAmount = booking.totalPrice;
        refundPercent = 100;
      } else if (hoursUntilStart >= 24) {
        refundAmount = Math.floor(booking.totalPrice / 2);
        refundPercent = 50;
      }
    } else {
      refundAmount = booking.totalPrice;
      refundPercent = 100;
    }

    const productName = booking.productName || booking.product?.nameAr || booking.product?.name || 'حجز';
    const escrowWasHeld = booking.escrowStatus === 'held';

    // Find associated payment
    const payment = booking.userId
      ? await db.payment.findFirst({
          where: { bookingId: id },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    // Build transaction operations
    const txOps: Prisma.PrismaPromise<unknown>[] = [
      // Always update booking status
      db.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          ...(escrowWasHeld ? { escrowStatus: 'refunded' } : {}),
        },
      }),
      // BUG-6: Expire any associated contract when booking is cancelled
      db.contract.updateMany({
        where: { bookingId: id, status: { in: ['draft', 'signed'] } },
        data: { status: 'expired' },
      }),
    ];

    // If escrow was held, update payment status too
    if (escrowWasHeld && payment) {
      txOps.push(
        db.payment.update({
          where: { id: payment.id },
          data: { escrowStatus: 'refunded', status: 'refunded' },
        }),
        db.transaction.create({
          data: {
            userId: booking.userId!,
            type: 'ESCROW_REFUNDED',
            amount: booking.totalPrice,
            referenceId: id,
            note: `استرداد ضمان حجز "${productName}" — إلغاء تلقائي`,
          },
        })
      );
    }

    // Wallet credit for refund amount (store credit)
    // FIX 1: Only credit wallet if escrow was 'held' (meaning payment was actually received)
    if (!escrowWasHeld) {
      refundAmount = 0;
      refundPercent = 0;
    }

    if (refundAmount > 0 && booking.userId) {
      txOps.push(
        db.user.update({
          where: { id: booking.userId },
          data: { walletBalance: { increment: refundAmount } },
        }),
        db.transaction.create({
          data: {
            userId: booking.userId,
            type: 'INCOME',
            amount: refundAmount,
            referenceId: id,
            note: `استرداد إلغاء حجز "${productName}" — ${refundPercent}%`,
          },
        })
      );
    }

    // Create RefundRecord for manual tracking (only if real money was in escrow)
    // FIX 1: Move RefundRecord.create() INSIDE the $transaction for atomicity
    let refundRecordId: string | null = null;
    if (escrowWasHeld && payment) {
      txOps.push(
        db.refundRecord.create({
          data: {
            bookingId: id,
            paymentId: payment.id,
            userId: booking.userId!,
            amount: booking.totalPrice,
            reason: 'cancelled',
            status: 'pending_manual_transfer',
            refundDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            processedBy: session.userId,
            notes: `إلغاء تلقائي — سياسة استرداد ${refundPercent}%${cancelReason ? ` | السبب: ${cancelReason}` : ''}`,
          },
        })
      );
    }

    // Execute all operations atomically
    const txResult = await db.$transaction(txOps);

    // Extract refundRecordId from transaction result if applicable
    if (escrowWasHeld && payment) {
      const lastOp = txResult[txResult.length - 1];
      if (lastOp && typeof lastOp === 'object' && 'id' in lastOp) {
        refundRecordId = (lastOp as { id: string }).id;
      }
      logger.info('Booking Cancel', `RefundRecord created: ${refundRecordId} for booking ${id}`);
    }

    // Create notification for the user
    const notificationMsg = escrowWasHeld
      ? `تم إلغاء حجز "${productName}". المبلغ محجوز في الضمان — سيتم التحويل خلال 48 ساعة (القانون 18-05 مادة 22).${cancelReason ? ` السبب: ${cancelReason}` : ''}`
      : `تم إلغاء حجز "${productName}". لا يوجد مبلغ لاسترداده لأنه لم يتم الدفع.${cancelReason ? ` السبب: ${cancelReason}` : ''}`;

    if (booking.userId) {
      await db.notification.create({
        data: {
          userId: booking.userId,
          type: 'financial',
          title: 'تم إلغاء الحجز',
          message: notificationMsg,
        },
      });
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: booking.id,
        status: 'cancelled',
        escrow_status: escrowWasHeld ? 'refunded' : booking.escrowStatus,
        refund_amount: refundAmount,
        refund_percent: refundPercent,
        refund_record_id: refundRecordId,
        escrow_was_held: escrowWasHeld,
        message: escrowWasHeld
          ? 'تم إلغاء الحجز — المبلغ محجوز وسيتم تحويله يدوياً خلال 48 ساعة'
          : 'تم إلغاء الحجز. لا يوجد مبلغ لاسترداده لأنه لم يتم الدفع بعد',
      },
    });
  } catch (error) {
    logger.error('Booking Cancel API', 'Error', error);
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
