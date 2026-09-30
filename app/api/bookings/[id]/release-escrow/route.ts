import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { computeContractHash } from '@/lib/contract-terms';
import { checkEscrowRateLimit } from '@/lib/rate-limiter';
import { computeAccruedLateFee, computeDepositReturn, countDays, formatDZD } from '@/lib/escrow';
import { queueEmail, renderEmailHtml } from '@/lib/email-outbox';

// ═══════════════════════════════════════════════════════════════
// POST /api/bookings/[id]/release-escrow
// LEGAL: Algerian Law 18-05 Article 17 — Delivery Receipt
// Chargily Pay has NO refund/payout API → manual money-out (Yassir model)
// P1 fix: rate limit added (was missing — compromised admin could mass-drain)
// ═══════════════════════════════════════════════════════════════
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  // P1 fix: rate limit (10/min/user) — slows down mass-drain attempts
  const rateCheck = checkEscrowRateLimit(session.userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Too many escrow operations, please wait.', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

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

    if (booking.status !== 'confirmed' && booking.status !== 'active' && booking.status !== 'overdue') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `حالة الحجز "${booking.status}" غير صالحة — يجب أن تكون مؤكدة أو نشطة أو متأخرة`,
          message_en: `Booking status "${booking.status}" is invalid — must be confirmed, active or overdue`,
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
    // P2-37 fix: was `findFirst({ where: { bookingId: id }})` — picked an
    // arbitrary row when multiple payment attempts exist. Now we target the
    // most recent completed payment, which is the one tied to the escrow.
    const payment = await db.payment.findFirst({
      where: { bookingId: id, status: 'completed' },
      orderBy: { createdAt: 'desc' },
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

    // ── Compute contract hash using the SAME deterministic function as generate ──
    let contractHash = contract?.contractHash || null;
    if (!contractHash && contract) {
      // Fallback: recompute from contract.terms if hash was missing
      contractHash = computeContractHash(contract.terms || '', id);
    }

    const vendorId = booking.product?.vendorId ?? null;

    // ── GRAFT PHASE 2: final money accounting (the khatamiya settlement) ──
    // lateFee: frozen by the sweep at overdue time. Fallback: if the booking
    // is overdue but the sweep hasn't stamped a fee yet (30s window), compute
    // it here — always capped at the deposit actually held.
    let lateFee = booking.lateFee ?? 0;
    if (lateFee === 0 && booking.status === 'overdue' && booking.endDate) {
      const daysLate = countDays(new Date(booking.endDate), new Date());
      lateFee = computeAccruedLateFee(daysLate, booking.lateFeePerDay, booking.depositHeld);
    }
    const depositHeldAmt = booking.depositHeld ?? 0;
    const depositReturned = computeDepositReturn(depositHeldAmt, lateFee);

    // ── Single transaction: all-or-nothing ──
    const result = await db.$transaction(async (tx) => {
      // (a) Update booking escrow + status + final money ledger
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          escrowStatus: 'released',
          status: 'completed',
          lateFee,
          depositReturned,
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

      // (c) Create ESCROW_RELEASED transaction — the COLLATERAL returning
      // to the renter (rent went to the vendor via PayoutRecord below).
      const txRecord = await tx.transaction.create({
        data: {
          userId: booking.userId!,
          type: 'ESCROW_RELEASED',
          amount: depositReturned,
          referenceId: booking.id,
          note:
            lateFee > 0
              ? `تحرير الضمان — وصل استلام مسجل (مادة 17 من القانون 18-05). غرامة تأخير ${formatDZD(lateFee)} خُصمت من الوديعة.`
              : 'تحرير الضمان — وصل استلام مسجل (مادة 17 من القانون 18-05)',
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
            lateFee > 0
              ? `تم تحرير الضمان — وصل الاستلام مسجل (مادة 17). الوديعة ${formatDZD(depositHeldAmt)} − غرامة تأخير ${formatDZD(lateFee)} = ${formatDZD(depositReturned)} تُعاد إليك خلال 48 ساعة.`
              : `تم تحرير الضمان — وصل الاستلام مسجل (مادة 17). الوديعة ${formatDZD(depositHeldAmt)} تُعاد إليك كاملة خلال 48 ساعة.`,
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
            // PHASE 2: vendor receives rent + late-fee compensation; the
            // deposit remainder goes back to the renter (see ESCROW_RELEASED).
            amount: booking.totalPrice + lateFee,
            status: 'pending_payout',
            notes: lateFee > 0
              ? `تحرير ضمان حجز #${booking.id} — المادة 17 (وصل استلام). يشمل تعويض تأخير ${formatDZD(lateFee)}.`
              : `تحرير ضمان حجز #${booking.id} — المادة 17 (وصل استلام)`,
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

    // ── GRAFT PHASE 2: outbox emails — release statement + review invite ──
    // Post-tx, never throws. The review gate makes every completed booking a
    // scarce review opportunity — invite the renter while trust is warm.
    try {
      const renter = await db.user.findUnique({
        where: { id: booking.userId! },
        select: { email: true, firstName: true },
      });
      if (renter?.email) {
        const lateLine =
          lateFee > 0
            ? `<p style="color:#b91c1c;">غرامة تأخير: −${formatDZD(lateFee)}</p>`
            : '';
        await queueEmail({
          to: renter.email,
          kind: 'ESCROW_RELEASED',
          bookingId: booking.id,
          userId: booking.userId!,
          subject: 'تم تحرير الضمان — كشف الحساب الختامي',
          html: renderEmailHtml(
            'تحرير الضمان',
            `<p>مرحباً ${renter.firstName || ''}،</p><p>تم تأكيد استلام «${booking.productName ?? ''}» وتحرير الضمان (المادة 17 من القانون 18-05).</p><p>الوديعة المحتجزة: ${formatDZD(depositHeldAmt)}</p>${lateLine}<p>المستحق إعادته إليك: <b>${formatDZD(depositReturned)}</b> خلال 48 ساعة.</p>`
          ),
        });
        await queueEmail({
          to: renter.email,
          kind: 'REVIEW_INVITE',
          bookingId: booking.id,
          userId: booking.userId!,
          subject: 'شاركنا تجربتك — تقييمك يبني الثقة',
          html: renderEmailHtml(
            'دعوة للتقييم',
            `<p>اكتمل حجز «${booking.productName ?? ''}» بنجاح. تقييمك للمؤجر يساعد بقية المستأجرين على الإيجار بلا همّ.</p>`
          ),
        });
      }
    } catch (e) {
      logger.error('Escrow Release', 'Outbox emails failed (non-fatal)', e);
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: result.updatedBooking.id,
        status: result.updatedBooking.status,
        escrow_status: result.updatedBooking.escrowStatus,
        payout_record_id: result.payoutRecord?.id ?? null,
        // PHASE 2: the khatamiya settlement, in the response.
        deposit_held: depositHeldAmt,
        late_fee: lateFee,
        deposit_returned: depositReturned,
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
