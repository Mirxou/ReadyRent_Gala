// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Payment Provider
// Chargily Pay (CIB + Edahabia) — primary gateway for Algeria
// ═══════════════════════════════════════════════════════════════

import { ChargilyClient, verifySignature } from '@chargily/chargily-pay';
import { logger } from './logger';

// ──── Types ────

export interface ChargilyCheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  checkoutId?: string;
  paymentId?: string;    // our internal Payment.id
  error?: string;
}

export interface WebhookVerifyResult {
  valid: boolean;
  event?: ChargilyWebhookEvent;
  error?: string;
}

/**
 * Chargily webhook payload structure.
 * Verified against PHP SDK (WebhookElement) and Laravel integration example.
 * Top-level fields: id, type, data, created_at, updated_at.
 * `type` = event type (e.g. "checkout.paid", "checkout.failed").
 * `data` = the full Checkout object (with status, metadata, etc.).
 */
export interface ChargilyWebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
    entity: string;
    status: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled';
    amount: number;
    currency: string;
    payment_method: string | null;
    metadata: Record<string, unknown>;
    success_url: string;
    failure_url: string;
    created_at: number;
    updated_at: number;
  } & Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

// ──── Singleton client ────

let _client: ChargilyClient | null = null;

function getChargilyClient(): ChargilyClient {
  if (!_client) {
    const apiKey = process.env.CHARGILY_API_KEY;
    if (!apiKey) {
      throw new Error('CHARGILY_API_KEY is not set');
    }
    _client = new ChargilyClient({
      api_key: apiKey,
      mode: (process.env.CHARGILY_MODE as 'test' | 'live') || 'test',
    });
  }
  return _client;
}

// ──── Chargily Payment Provider ────

export class ChargilyPaymentProvider {
  /**
   * Create a Chargily checkout session.
   *
   * Simplified flow (1 API call): uses amount + currency directly.
   * Verified: CreateCheckoutParams supports `amount` + `currency` as
   * alternative to `items` (confirmed by Chargily Laravel integration example).
   *
   * No payment_method set → user can choose between CIB and Edahabia
   * on the hosted checkout page.
   */
  async createCheckout(params: {
    amount: number;          // in DZD (not cents)
    paymentId: string;       // our internal Payment.id
    bookingId: string;       // our Booking.id
    description: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    successUrl: string;
    failureUrl: string;
  }): Promise<ChargilyCheckoutResult> {
    const client = getChargilyClient();

    try {
      // Single API call: amount + currency directly (no Product/Price needed)
      const checkout = await client.createCheckout({
        amount: params.amount,
        currency: 'dzd',
        description: params.description,
        success_url: params.successUrl,
        failure_url: params.failureUrl,
        locale: 'ar',
        pass_fees_to_customer: false,
        metadata: {
          payment_id: params.paymentId,
          booking_id: params.bookingId,
        },
      });

      if (!checkout?.id || !checkout?.checkout_url) {
        logger.error('Chargily', 'createCheckout returned no URL', checkout);
        return { success: false, error: 'FAILED_TO_CREATE_CHECKOUT' };
      }

      logger.info('Chargily', 'Checkout created', {
        checkoutId: checkout.id,
        paymentId: params.paymentId,
        amount: params.amount,
      });

      return {
        success: true,
        checkoutUrl: checkout.checkout_url,
        checkoutId: checkout.id,
        paymentId: params.paymentId,
      };
    } catch (error) {
      logger.error('Chargily', 'createCheckout error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CHARGILY_ERROR',
      };
    }
  }

  /**
   * Verify a Chargily webhook signature.
   * Must be called with raw body (Buffer) and the signature header.
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const apiKey = process.env.CHARGILY_API_KEY;
    if (!apiKey) return false;

    try {
      return verifySignature(rawBody, signature, apiKey);
    } catch (error) {
      logger.error('Chargily', 'verifyWebhookSignature error', error);
      return false;
    }
  }
}

// ──── Provider singleton ────

let _provider: ChargilyPaymentProvider | null = null;

export function getChargilyProvider(): ChargilyPaymentProvider {
  if (!_provider) {
    _provider = new ChargilyPaymentProvider();
  }
  return _provider;
}
