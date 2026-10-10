// ═══════════════════════════════════════════════════════════════
// POST /api/payments/chargily/checkout
// Creates a Chargily checkout session and returns the redirect URL.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { getChargilyProvider } from '@/lib/payment-provider';
import { logger } from '@/lib/logger';
import { checkPaymentRateLimit, getClientIp } from '@/lib/rate-limiter';
import { computeDepositHeld, countDays } from '@/lib/escrow';

const ALLOWED_AMOUNTS = { min: 100, max: 5_000_000 };

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // ── Rate limiting ──
    const clientIp = getClientIp(request);
    const rateCheck = checkPaymentRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'محاولات كثيرة. حاول بعد قليل.', message_en: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { booking_id, amount } = body;

    // ── Validation ──
    if (!booking_id || typeof booking_id !== 'string') {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'معرف الحجز مطلوب', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    if (!amount || typeof amount !== 'number' || amount < ALLOWED_AMOUNTS.min || amount > ALLOWED_AMOUNTS.max) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'المبلغ غير صالح', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    // ── Verify booking ownership ──
    // PHASE 2 (escrow marriage): the charge is no longer rent-only. The
    // sovereign deposit is captured WITH the rent — one checkout, full hold.
    const booking = await db.booking.findUnique({
      where: { id: booking_id },
      select: {
        userId: true,
        productName: true,
        status: true,
        totalPrice: true,
        startDate: true,
        endDate: true,
        quantity: true,
        product: { select: { depositAmount: true, pricePerDay: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'الحجز غير موجود', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    if (booking.userId !== session.userId) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'غير مصرح', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'هذا الحجز غير قابل للدفع', code: 'INVALID_BOOKING_STATUS' },
        { status: 400 },
      );
    }

    // ── Server-side amount verification (prevent price manipulation) ──
    // rentalBasis excludes insurance: deposits collateralize the RENTAL.
    const rentalBasis =
      booking.product?.pricePerDay && booking.startDate && booking.endDate
        ? booking.product.pricePerDay *
          countDays(new Date(booking.startDate), new Date(booking.endDate)) *
          (booking.quantity || 1)
        : 0;
    const depositHeld = computeDepositHeld(booking.product?.depositAmount, rentalBasis);
    const safeAmount = booking.totalPrice + depositHeld;

    if (amount !== safeAmount) {
      logger.warn('Chargily/Checkout', 'Amount mismatch', {
        expected: safeAmount,
        received: amount,
        bookingId: booking_id,
      });
      // Use server-side amount
    }

    // ── Get user info for Chargily customer ──
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://standardrent.dz';

    // ── Create Payment record ──
    const payment = await db.payment.create({
      data: {
        userId: session.userId,
        bookingId: booking_id,
        amount: safeAmount,
        method: 'card',
        status: 'pending',
        escrowStatus: 'none',
      },
    });

    // ── Create Chargily checkout ──
    const provider = getChargilyProvider();
    const result = await provider.createCheckout({
      amount: safeAmount,
      paymentId: payment.id,
      bookingId: booking_id,
      description: `إيجار: ${booking.productName || 'خدمة إيجار'}`,
      customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
      customerEmail: user?.email ?? undefined,
      customerPhone: user?.phone ?? undefined,
      successUrl: `${baseUrl}/checkout?status=success&payment_id=${payment.id}`,
      failureUrl: `${baseUrl}/checkout?status=failed&payment_id=${payment.id}`,
    });

    if (!result.success) {
      // Update payment as failed
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      logger.error('Chargily/Checkout', 'Checkout creation failed', { error: result.error, paymentId: payment.id });

      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'فشل إنشاء عملية الدفع', code: 'CHECKOUT_FAILED', error: result.error },
        { status: 500 },
      );
    }

    // ── Update payment with Chargily checkout ID and redirect URL ──
    await db.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: result.checkoutId,
        redirectUrl: result.checkoutUrl,
        requires3DSecure: true, // CIB always uses 3D Secure
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        payment_id: payment.id,
        checkout_url: result.checkoutUrl,
        checkout_id: result.checkoutId,
        // PHASE 2: honest money breakdown — the deposit is real now.
        amount: safeAmount,
        rent_amount: booking.totalPrice,
        deposit_amount: depositHeld,
      },
    });
  } catch (error) {
    logger.error('Chargily/Checkout', 'Unhandled error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'خطأ داخلي', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
