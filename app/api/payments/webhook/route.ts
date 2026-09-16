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
    const eventId = (event.id as string) || '';
    const eventData = event.data as Record<string, unknown> | undefined;
    const checkoutId = (eventData?.id as string) || '';
    const checkoutStatus = (eventData?.status as string) || '';
    const paymentId = (eventData?.metadata as Record<string, string>)?.payment_id || '';
    const bookingId = (eventData?.metadata as Record<string, string>)?.booking_id || '';

    logger.info('Webhook', `Received event: ${eventType}`, { eventId, checkoutId, checkoutStatus, paymentId, bookingId });

    // 4. Only process checkout events
    if (!eventType.startsWith('checkout')) {
      logger.info('Webhook', 'Ignoring non-checkout event', { eventType });
      return NextResponse.json({ received: true });
    }

    if (!eventId) {
      logger.warn('Webhook', 'Event has no id — cannot guarantee idempotency, refusing to process', { eventType });
      return NextResponse.json({ error: 'MISSING_EVENT_ID' }, { status: 400 });
    }

    // 5. P1 fix: idempotency check — if we've already processed this event.id, ack and exit
    const alreadyProcessed = await db.processedWebhookEvent.findUnique({
      where: { eventId },
      select: { id: true, eventType: true, processedAt: true },
    });
    if (alreadyProcessed) {
      logger.info('Webhook', 'Duplicate event already processed — acking', { eventId, eventType: alreadyProcessed.eventType });
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 6. Find our Payment record
    const payment = paymentId
      ? await db.payment.findUnique({ where: { id: paymentId } })
      : await db.payment.findFirst({ where: { providerPaymentId: checkoutId } });

    if (!payment) {
      logger.warn('Webhook', 'Payment not found', { paymentId, checkoutId });
      // Still record the event so we don't keep retrying a non-actionable event
      await db.processedWebhookEvent.create({
        data: { eventId, eventType, paymentId: null },
      }).catch((e: unknown) => logger.error('Webhook', 'Failed to record non-actionable event', e));
      return NextResponse.json({ received: true }); // Acknowledge to prevent retries
    }

    // 7. P1 fix: wrap ALL side-effects in a single $transaction with the idempotency record
    if (checkoutStatus === 'paid' && payment.status !== 'completed') {
      await handlePaymentSuccessAtomic(payment.id, payment.bookingId, eventId, eventType);
      logger.info('Webhook', 'Payment confirmed', { paymentId: payment.id, bookingId: payment.bookingId, eventId });
    } else if ((checkoutStatus === 'failed' || checkoutStatus === 'canceled') && payment.status !== 'failed') {
      await db.$transaction([
        db.processedWebhookEvent.create({
          data: { eventId, eventType, paymentId: payment.id },
        }),
        db.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        }),
      ]);
      logger.info('Webhook', 'Payment failed', { paymentId: payment.id, status: checkoutStatus, eventId });
    } else {
      // Already in the target state — just record the event for idempotency
      await db.processedWebhookEvent.create({
        data: { eventId, eventType, paymentId: payment.id },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook', 'Unhandled error', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// Side Effects: Payment Success (P1 fix — atomic $transaction)
// All 5 writes (Payment update, Booking update, 2× Transaction, Notification)
// are wrapped in a single transaction together with the idempotency record.
// If any step fails, the entire side-effect is rolled back and Chargily will retry.
// ═══════════════════════════════════════════════════════════════

async function handlePaymentSuccessAtomic(
  paymentId: string,
  bookingId: string | null,
  eventId: string,
  eventType: string,
) {
  // ── 1. Atomic core: idempotency + payment + booking + transactions + notification ──
  await db.$transaction(async (tx) => {
    // Insert the idempotency record first — if it fails (unique constraint),
    // the entire transaction rolls back, signaling a duplicate race.
    await tx.processedWebhookEvent.create({
      data: { eventId, eventType, paymentId },
    });

    // Fetch the payment row inside the tx so we have a consistent snapshot
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, userId: true, amount: true, status: true, bookingId: true },
    });

    if (!payment) {
      throw new Error(`Payment ${paymentId} vanished between lookup and transaction`);
    }

    // Defensive: another concurrent webhook may have already completed it
    if (payment.status === 'completed') {
      logger.info('Webhook', 'Payment already completed inside tx — likely concurrent webhook, aborting', { paymentId });
      // Throwing here will roll back the idempotency row too, so the duplicate event
      // can be retried without falsely claiming to have processed it. We rely on the
      // outer pre-check to short-circuit subsequent deliveries.
      throw new Error('ALREADY_COMPLETED');
    }

    // Update Payment → completed + escrow held
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'completed',
        escrowStatus: 'held',
      },
    });

    // Update Booking → confirmed (only if bookingId exists)
    if (bookingId) {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'confirmed',
          escrowStatus: 'held',
        },
      });
    }

    // Create wallet transaction records (only if userId exists — P0-8 makes it required)
    if (payment.userId) {
      await tx.transaction.create({
        data: {
          userId: payment.userId,
          type: 'EXPENDITURE',
          amount: payment.amount,
          note: `دفع حجز #${bookingId ?? '—'} — عبر Chargily Pay`,
          referenceId: bookingId ?? undefined,
        },
      });

      await tx.transaction.create({
        data: {
          userId: payment.userId,
          type: 'ESCROW_HELD',
          amount: payment.amount,
          note: `ضمان حجز #${bookingId ?? '—'}`,
          referenceId: bookingId ?? undefined,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: payment.userId,
          type: 'financial',
          title: 'تم تأكيد الدفع',
          message: 'تم استلام دفع حجزك بنجاح. المبلغ محتجز في الضمان السيادي حتى تأكيد الاستلام.',
        },
      });
    }
  }).catch((err: unknown) => {
    // If it was our defensive ALREADY_COMPLETED signal, swallow it
    if (err instanceof Error && err.message === 'ALREADY_COMPLETED') {
      return;
    }
    // Otherwise rethrow — the outer catch will return 500 to Chargily so it retries
    throw err;
  });

  // ── 2. Auto-generate contract — outside the main tx, but idempotent ──
  // Contract generation is heavy (9-section terms + SHA-256) and is idempotent
  // on its own (it checks for an existing contract by bookingId), so it can run
  // outside the main tx without breaking the financial state.
  if (bookingId) {
    // Re-read the payment to get userId (the tx above may have changed state)
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      select: { userId: true },
    });
    if (payment?.userId) {
      await ensureContractForBooking(bookingId, payment.userId).catch((e: unknown) => {
        // Don't fail the webhook if contract generation fails — payment is already recorded
        logger.error('Webhook', 'Contract generation failed (non-fatal — payment is recorded)', e);
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Auto-generate contract on payment success (Step 2.4)
// Creates draft contract with all 9 sections if none exists.
// Already idempotent — uses findUnique on bookingId.
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
