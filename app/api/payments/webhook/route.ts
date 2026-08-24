// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Payment Webhook Endpoint
// POST /api/payments/webhook
// Receives webhook callbacks from payment providers (CIB/Stripe).
// Stub — logs incoming payload for future integration.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // Capture raw body for signature verification (future)
    const rawBody = await request.text();

    // Parse for logging (in production, verify HMAC signature first)
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody.slice(0, 200) };
    }

    logger.info('Payments/Webhook', 'Received webhook', {
      provider: (payload.provider as string) || 'unknown',
      eventType: (payload.event_type as string) || (payload.type as string) || 'unknown',
      transactionId: (payload.transaction_id as string) || (payload.id as string) || null,
    });

    // ── Future integration steps ──
    // 1. Verify webhook signature (HMAC or Stripe webhook secret)
    // 2. Extract transactionId and status from payload
    // 3. Update payment record in DB via db.payment.update()
    // 4. Trigger side effects (booking confirmation, email, notification)

    return NextResponse.json(
      { success: true, message: 'Webhook received (stub)' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Payments/Webhook', 'Error processing webhook', error);
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    );
  }
}
