// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n// POST /api/bookings/[id]/refund-escrow
// ADMIN/STAFF ONLY — renters CANNOT self-refund
// LEGAL: Algerian Law 18-05 Article 22 — refund within 15 days
// Chargily Pay has NO refund API → manual bank transfer (Yassir model)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

const VALID_REFUND_REASONS = [
  'late_delivery',
  'defective',
  'cancelled',
  'customer_request',
  'other',
] as const;

type RefundReason = (typeof VALID_REFUND_REASONS)[number];

interface RefundEscrowBody {
  reason: RefundReason;
  notes?: string;
  wallet_credit?: boolean;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    // ── Authorization: admin/staff ONLY ──
    const adminUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'staff')) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'هذا الإجراء مخصص للإدارة فقط',
          message_en: 'This action is restricted to administrators only',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // ── Parse & validate body ──
    const body: RefundEscrowBody = await request.json();

    if (!body.reason || !VALID_REFUND_REASONS.includes(body.reason as RefundReason)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'سبب الاسترداد غير صالح',
          message_en: 'Invalid refund reason',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // ── Fetch booking ──
    const booking = await db.booking.findUnique({
      where: { id },
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

    // ── Validation: escrow must be 'held' ──
    if (booking.escrowStatus !== 'held') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `حالة الضمان \"${booking.escrowStatus}\" غير صالحة — يجب أن تكون محتجزة`,
          message_en: `Escrow status \"${booking.escrowStatus}\" is invalid — must be held`,
          code: 'INVALID_ESCROW_STATUS',
        },
        { status: 400 }
      );
    }

    if (!booking.userId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الحجز لا يملك مستخدم',
          message_en: 'Booking has no associated user',
          code: 'INVALID_BOOKING',
        },
        { status: 400 }
      );
    }

    // ── Find payment for this booking ──
    const payment = await db.payment.findFirst({
      where: { bookingId: id },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لم يتم العثور على دفعة لهذا الحجز',
          message_en: 'No payment found for this booking',
          code: 'PAYMENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const walletCredit = body.wallet_credit === true;
    const refundDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    // ── Single transaction: all-or-nothing ──
    const result = await db.$transaction(async (tx) => {
      // (a) Update booking escrow + status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          escrowStatus: 'refunded',
          status: 'cancelled',
        },
      });

      // (c) Update payment escrow + status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          escrowStatus: 'refunded',
          status: 'refunded',
        },
      });

      // (d) Create ESCROW_REFUNDED transaction
      const txRecord = await tx.transaction.create({
        data: {
          userId: booking.userId!,
          type: 'ESCROW_REFUNDED',
          amount: booking.totalPrice,
          referenceId: booking.id,
          note: `استرداد ضمان — السبب: ${body.reason}${body.notes ? ` | ${body.notes}` : ''}`,
        },
      });

      // (e) If wallet_credit → add amount to user's walletBalance
      if (walletCredit) {
        await tx.user.update({
          where: { id: booking.userId! },
          data: {
            walletBalance: {
              increment: booking.totalPrice,
            },
          },
        });
      }

      // (f) Create Notification for user
      const notificationMessage = walletCredit
        ? 'تمت الموافقة على استرداد المبلغ — تمت إضافة الرصيد إلى محفظتك'
        : 'تمت الموافقة على استرداد المبلغ — سيتم التحويل خلال 48 ساعة';

      await tx.notification.create({
        data: {
          userId: booking.userId!,
          type: 'financial',
          title: 'استرداد ضمان',
          message: notificationMessage,
        },
      });

      // (g) Create RefundRecord
      const refundRecord = await tx.refundRecord.create({
        data: {
          bookingId: booking.id,
          paymentId: payment.id,
          userId: booking.userId!,
          amount: booking.totalPrice,
          reason: body.reason,
          status: walletCredit ? 'completed' : 'pending_manual_transfer',
          refundDeadline,
          transferMethod: walletCredit ? 'wallet_credit' : null,
          processedBy: session.userId,
          notes: body.notes ?? null,
        },
      });

      return { updatedBooking, txRecord, refundRecord };
    });

    logger.info(
      'Escrow Refund',
      `Escrow refunded for booking ${id} — Article 22 (15-day deadline)`,
      {
        bookingId: id,
        adminUserId: session.userId,
        paymentId: payment.id,
        refundRecordId: result.refundRecord.id,
        reason: body.reason,
        walletCredit,
        refundDeadline: refundDeadline.toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        booking_id: result.updatedBooking.id,
        status: result.updatedBooking.status,
        escrow_status: result.updatedBooking.escrowStatus,
        refund_record_id: result.refundRecord.id,
        refund_deadline: refundDeadline.toISOString(),
        wallet_credited: walletCredit,
      },
    });
  } catch (error) {
    logger.error('Escrow Refund API', 'Error processing escrow refund', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء معالجة الاسترداد',
        message_en: 'An error occurred while processing the refund',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
