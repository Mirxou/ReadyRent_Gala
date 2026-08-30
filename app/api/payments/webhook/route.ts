// ═══════════════════════════════════════════════════════════════
// POST /api/payments/webhook
// Receives and processes Chargily Pay webhook events.
// IMPORTANT: Must read raw body first for signature verification.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getChargilyProvider } from '@/lib/payment-provider';
import { logger } from '@/lib/logger';
import { generateContractTerms, computeContractHash } from '@/lib/contract-terms';

// Disable Next.js body parsing — we need raw body for HMAC verification
export const runtime = 'nodejs';

export async function POST(request: Request) {
  let rawBody: Buffer;

  try {
    // 1. Read raw body FIRST (needed for signature verification)
    rawBody = Buffer.from(await request.text());

    // 2. Verify webhook signature
    const signature = request.headers.get('signature') || '';
    if (!signature) {
      logger.warn('Webhook', 'Missing signature header');
      return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 400 });
    }

    const provider = getChargilyProvider();
    const isValid = provider.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      logger.warn('Webhook', 'Invalid signature');
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 403 });
    }

    // 3. Parse the verified payload
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody.toString('utf-8'));
    } catch {
      logger.error('Webhook', 'Failed to parse body as JSON');
      return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
    }

    // Webhook payload structure (verified against Chargily PHP/Laravel SDK):
    //   { id, type: "checkout.paid", data: <full Checkout object>, created_at, updated_at }
    const eventType = (event.type as string) || 'unknown';
    const eventData = event.data as Record<string, unknown> | undefined;
    const checkoutId = (eventData?.id as string) || '';
    const checkoutStatus = (eventData?.status as string) || '';
    const paymentId = (eventData?.metadata as Record<string, string>)?.payment_id || '';
    const bookingId = (eventData?.metadata as Record<string, string>)?.booking_id || '';

    logger.info('Webhook', `Received event: ${eventType}`, { checkoutId, checkoutStatus, paymentId, bookingId });

    // 4. Only process checkout events
    if (!eventType.startsWith('checkout')) {
      logger.info('Webhook', 'Ignoring non-checkout event', { eventType });
      return NextResponse.json({ received: true });
    }

    // 5. Find our Payment record
    const payment = paymentId
      ? await db.payment.findUnique({ where: { id: paymentId } })
      : await db.payment.findFirst({ where: { providerPaymentId: checkoutId } });

    if (!payment) {
      logger.warn('Webhook', 'Payment not found', { paymentId, checkoutId });
      return NextResponse.json({ received: true }); // Acknowledge to prevent retries
    }

    // 6. Process based on checkout status (verified: data.status === 'paid' | 'failed' | 'canceled')
    if (checkoutStatus === 'paid' && payment.status !== 'completed') {
      // ── PAYMENT SUCCESS ──
      await handlePaymentSuccess(payment.id, payment.bookingId);
      logger.info('Webhook', 'Payment confirmed', { paymentId: payment.id, bookingId: payment.bookingId });
    } else if ((checkoutStatus === 'failed' || checkoutStatus === 'canceled') && payment.status !== 'failed') {
      // ── PAYMENT FAILED ──
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
      logger.info('Webhook', 'Payment failed', { paymentId: payment.id, status: checkoutStatus });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook', 'Unhandled error', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// Side Effects: Payment Success
// ═══════════════════════════════════════════════════════════════

async function handlePaymentSuccess(paymentId: string, bookingId: string | null) {
  // 1. Update Payment → completed + escrow held
  await db.payment.update({
    where: { id: paymentId },
    data: {
      status: 'completed',
      escrowStatus: 'held',
    },
  });

  if (!bookingId) return;

  // 2. Update Booking → confirmed
  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: 'confirmed',
      escrowStatus: 'held',
    },
  });

  // 3. Create wallet transaction record
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { userId: true, amount: true },
  });

  if (payment?.userId) {
    await db.transaction.create({
      data: {
        userId: payment.userId,
        type: 'EXPENDITURE',
        amount: payment.amount,
        note: `دفع حجز #${bookingId} — عبر Chargily Pay`,
      },
    });

    await db.transaction.create({
      data: {
        userId: payment.userId,
        type: 'ESCROW_HELD',
        amount: payment.amount,
        note: `ضمان حجز #${bookingId}`,
      },
    });
  }

  // 4. Create notification
  if (payment?.userId) {
    await db.notification.create({
      data: {
        userId: payment.userId,
        type: 'financial',
        title: 'تم تأكيد الدفع',
        message: 'تم استلام دفع حجزك بنجاح. المبلغ محتجز في الضمان السيادي حتى تأكيد الاستلام.',
      },
    });
  }

  // 5. Auto-generate contract for this booking (Step 2.4)
  //    If a draft contract already exists, leave it as-is for manual signing.
  //    If no contract exists, create one in 'draft' status — user signs later.
  await ensureContractForBooking(bookingId, payment.userId);
}

// ═══════════════════════════════════════════════════════════════
// Auto-generate contract on payment success (Step 2.4)
// Creates draft contract with all 9 sections if none exists.
// ═══════════════════════════════════════════════════════════════
async function ensureContractForBooking(bookingId: string, userId: string) {
  // Skip if contract already exists (may have been pre-generated)
  const existing = await db.contract.findUnique({ where: { bookingId } });
  if (existing) {
    logger.info('Webhook', 'Contract already exists for booking — skipping auto-generation', { bookingId, contractId: existing.id, status: existing.status });
    return;
  }

  // Fetch booking with product + user info
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      product: { select: { id: true, name: true, nameAr: true, vendorId: true, description: true, depositAmount: true } },
      user: { select: { id: true, username: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  if (!booking?.product || !booking.user) {
    logger.warn('Webhook', 'Cannot generate contract — missing booking/product/user', { bookingId });
    return;
  }

  // Get vendor info
  const vendor = booking.product.vendorId
    ? await db.user.findUnique({ where: { id: booking.product.vendorId }, select: { id: true, username: true, firstName: true, lastName: true, email: true } })
    : null;

  const renterName = `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.username || 'مستأجر';
  const vendorName = vendor ? `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || vendor.username || 'مؤجر' : 'مؤجر';

  // Generate terms (9-section Arabic contract)
  const terms = generateContractTerms({
    renterName,
    renterEmail: booking.user.email || '',
    renterPhone: booking.user.phone || null,
    vendorName,
    vendorEmail: vendor?.email || '',
    productName: booking.product.nameAr || booking.product.name || booking.productName || 'منتج',
    productDescription: booking.product.description || null,
    startDate: booking.startDate?.toISOString().split('T')[0] || '',
    endDate: booking.endDate?.toISOString().split('T')[0] || '',
    totalPrice: booking.totalPrice || 0,
    depositAmount: booking.product.depositAmount || undefined,
  });

  // Deterministic SHA-256 hash
  const contractHash = computeContractHash(terms, bookingId);

  // Build parties JSON
  const parties = JSON.stringify([
    { id: booking.userId, name: renterName, role: 'renter', signed: false },
    ...(vendor ? [{ id: vendor.id, name: vendorName, role: 'vendor', signed: false }] : []),
  ]);

  // Build snapshot JSON (consistent with generate route)
  const snapshot = JSON.stringify({
    booking_id: bookingId,
    product_name: booking.productName,
    product_id: booking.productId,
    total_price: booking.totalPrice,
    deposit_amount: booking.product.depositAmount ?? null,
    start_date: booking.startDate?.toISOString(),
    end_date: booking.endDate?.toISOString(),
    escrow_status: 'held',
  });

  // BUG-13: Wrap in $transaction for atomicity
  await db.$transaction([
    db.contract.create({
      data: {
        bookingId,
        status: 'draft',
        contractHash,
        terms,
        parties,
        snapshot,
      },
    }),
    db.notification.create({
      data: {
        userId,
        type: 'booking',
        title: 'تم إنشاء عقد إيجارك',
        message: 'تم إنشاء عقد رقمي لحجزك تلقائيًا. يرجى مراجعة البنود والتوقيع.',
      },
    }),
  ]);

  logger.info('Webhook', 'Auto-generated draft contract for booking', { bookingId });
}
