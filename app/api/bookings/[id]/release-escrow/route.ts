import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// POST /api/bookings/[id]/release-escrow
// LEGAL: Algerian Law 18-05 Article 17 — Delivery Receipt
// Chargily Pay has NO refund/payout API → manual money-out (Yassir model)
// ═══════════════════════════════════════════════════════════════
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    // ── Fetch booking with product + user role ──
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, nameAr: true, vendorId: true } },
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

    // ── Authorization: booking owner OR admin/staff ──
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
          message_ar: 'غير مصرح بتحرير الضمان لهذا الحجز',
          message_en: 'Not authorized to release escrow for this booking',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // ── Validation: escrow must be 'held' AND status must be 'confirmed' or 'active' ──
    if (booking.escrowStatus !== 'held') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `حالة الضمان "${booking.escrowStatus}" غير صالحة — يجب أن تكون محتجزة`,
          message_en: `Escrow status "${booking.escrowStatus}" is invalid — must be held`,
          code: 'INVALID_ESCROW_STATUS',
        },
        { status: 400 }
      );
    }

    if (booking.status !== 'confirmed' && booking.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `حالة الحجز "${booking.status}" غير صالحة — يجب أن تكون مؤكدة أو نشطة`,
          message_en: `Booking status "${booking.status}" is invalid — must be confirmed or active`,
          code: 'INVALID_BOOKING_STATUS',
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

    // ── Find contract for this booking ──
    const contract = await db.contract.findFirst({
      where: { bookingId: id },
    });

    // ── Compute contract hash: SHA-256(deterministic booking fields) ──
    const contractHash = crypto
      .createHash('sha256')
      .update(`${booking.id}|${booking.userId}|${booking.productId}|${booking.startDate}|${booking.endDate}|${booking.totalPrice}`)
      .digest('hex');

    const vendorId = booking.product?.vendorId ?? null;

    // ── Single transaction: all-or-nothing ──
    const result = await db.$transaction(async (tx) => {
      // (a) Update booking escrow + status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          escrowStatus: 'released',
          status: 'completed',
        },
      });

      // (b) Update payment escrow + status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          escrowStatus: 'released',
          status: 'released',
        },
      });

      // (c) Create ESCROW_RELEASED transaction
      const txRecord = await tx.transaction.create({
        data: {
          userId: booking.userId!,
          type: 'ESCROW_RELEASED',
          amount: booking.totalPrice,
          referenceId: booking.id,
          note: 'تحرير الضمان — وصل استلام مسجل (مادة 17 من القانون 18-05)',
        },
      });

      // (d) Finalize contract
      if (contract) {
        await tx.contract.update({
          where: { id: contract.id },
          data: {
            status: 'finalized',
            isFinalized: true,
            contractHash,
          },
        });
      }

      // (e) Notification for renter — delivery receipt confirmed (Article 17)
      await tx.notification.create({
        data: {
          userId: booking.userId!,
          type: 'financial',
          title: 'تحرير الضمان',
          message:
            'تم تحرير المبلغ للمؤجر — وصل الاستلام مسجل (مادة 17)',
        },
      });

      // (f) Notification for vendor (if product has vendorId)
      //     NOTE: The Vendor model does not have a userId field.
      //     The PayoutRecord below tracks the vendor payout obligation.
      //     Vendor outreach is handled out-of-band by admin/staff.
      //     Skipping user-level notification for vendor.

      // (g) Create PayoutRecord (Yassir model: manual money-out)
      let payoutRecord: { id: string } | null = null;
      if (vendorId) {
        const created = await tx.payoutRecord.create({
          data: {
            bookingId: booking.id,
            vendorId,
            userId: booking.userId!,
            amount: booking.totalPrice,
            status: 'pending_payout',
            notes: `تحرير ضمان حجز #${booking.id} — المادة 17 (وصل استلام)`,
          },
          select: { id: true },
        });
        payoutRecord = created;
      }

      return { updatedBooking, txRecord, payoutRecord };
    });

    logger.info(
      'Escrow Release',
      `Escrow released for booking ${id} — Article 17 delivery receipt`,
      {
        bookingId: id,
        userId: session.userId,
        paymentId: payment.id,
        contractId: contract?.id ?? null,
        vendorId,
        payoutRecordId: result.payoutRecord?.id ?? null,
      }
    );

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: result.updatedBooking.id,
        status: result.updatedBooking.status,
        escrow_status: result.updatedBooking.escrowStatus,
        payout_record_id: result.payoutRecord?.id ?? null,
      },
    });
  } catch (error) {
    logger.error('Escrow Release API', 'Error releasing escrow', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء تحرير الضمان',
        message_en: 'An error occurred while releasing escrow',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
