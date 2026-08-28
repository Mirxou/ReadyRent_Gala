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

export interface ChargilyWebhookEvent {
  id: string;
  type: string;
  entity: string;
  data: {
    id: string;
    payment_method?: string;
    status?: string;
    amount?: number;
  } & Record<string, unknown>;
  created_at: string;
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
   * Flow:
   * 1. Create a Product in Chargily (generic "rental service")
   * 2. Create a Price for that product
   * 3. Create a Checkout session → returns checkout_url
   * 4. Return the checkout_url to redirect the user
   */
  async createCheckout(params: {
    amount: number;          // in DZD (cents not needed — Chargily uses DZD directly)
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
      // 1. Create a generic product for this payment
      const product = await client.createProduct({
        name: params.description.slice(0, 100),
        description: params.description,
      });

      if (!product?.id) {
        logger.error('Chargily', 'createProduct returned no ID', product);
        return { success: false, error: 'FAILED_TO_CREATE_PRODUCT' };
      }

      // 2. Create a price for the product
      const price = await client.createPrice({
        amount: params.amount,
        currency: 'dzd',
        product_id: product.id,
      });

      if (!price?.id) {
        logger.error('Chargily', 'createPrice returned no ID', price);
        return { success: false, error: 'FAILED_TO_CREATE_PRICE' };
      }

      // 3. Create checkout session
      const checkout = await client.createCheckout({
        items: [{ price: price.id, quantity: 1 }],
        success_url: params.successUrl,
        failure_url: params.failureUrl,
        payment_method: 'edahabia', // Edahabia is default; Chargily shows CIB as option too
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
