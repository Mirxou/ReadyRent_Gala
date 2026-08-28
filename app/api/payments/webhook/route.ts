// ═══════════════════════════════════════════════════════════════
// POST /api/payments/webhook
// Receives and processes Chargily Pay webhook events.
// IMPORTANT: Must read raw body first for signature verification.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getChargilyProvider } from '@/lib/payment-provider';
import { logger } from '@/lib/logger';

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

    const eventType = (event.entity as string) || 'unknown';
    const eventData = event.data as Record<string, unknown> | undefined;
    const checkoutId = (eventData?.id as string) || '';
    const paymentId = (eventData?.metadata as Record<string, string>)?.payment_id || '';
    const bookingId = (eventData?.metadata as Record<string, string>)?.booking_id || '';

    logger.info('Webhook', `Received event: ${eventType}`, { checkoutId, paymentId, bookingId });

    // 4. Find our Payment record by providerPaymentId
    const payment = paymentId
      ? await db.payment.findUnique({ where: { id: paymentId } })
      : await db.payment.findFirst({ where: { providerPaymentId: checkoutId } });

    if (!payment) {
      logger.warn('Webhook', 'Payment not found', { paymentId, checkoutId });
      return NextResponse.json({ received: true }); // Acknowledge to prevent retries
    }

    // 5. Process based on event type
    if (eventType === 'checkout' || eventType === 'invoice') {
      // Chargily sends entity: 'checkout' for checkout events
      // The status is in event.data.status or the entity name tells us
      // For Chargily v2, a successful payment webhook comes with entity type
      // that indicates the payment was completed.

      // Check if this is a paid event (Chargily sends webhooks on status changes)
      const entityAction = (event.entity as string) || '';
      const isPaid = entityAction.includes('paid') || entityAction.includes('completed') || entityAction.includes('checkout');

      // Also check status field if available
      const status = (eventData?.status as string) || '';
      const isFailed = status === 'failed' || status === 'expired' || entityAction.includes('failed');

      if (isPaid && !isFailed) {
        // ── PAYMENT SUCCESS ──
        await handlePaymentSuccess(payment.id, payment.bookingId);
        logger.info('Webhook', 'Payment confirmed', { paymentId: payment.id, bookingId: payment.bookingId });
      } else if (isFailed) {
        // ── PAYMENT FAILED ──
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });
        logger.info('Webhook', 'Payment failed', { paymentId: payment.id });
      }
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
        message: `تم استلام دفع حجزك بنجاح. المبلغ محتجز في الضمان السيادي حتى تأكيد الاستلام.`,
      },
    });
  }

  // 5. Update contract → signed (auto-generated contract for rental)
  const contract = await db.contract.findFirst({
    where: { bookingId },
    orderBy: { createdAt: 'desc' },
  });

  if (contract && contract.status === 'draft') {
    await db.contract.update({
      where: { id: contract.id },
      data: { status: 'signed' },
    });
  }
}
