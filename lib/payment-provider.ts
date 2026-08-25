// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Abstract Payment Provider
// Pluggable payment gateways: CIB/Edahabia (Algeria) + Stripe (international)
// ═══════════════════════════════════════════════════════════════

// ──── Types ────

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface PaymentVerifyResult {
  verified: boolean;
  amount?: number;
}

export interface CreatePaymentParams {
  amount: number;
  orderId: string;
  description: string;
  returnUrl: string;
  webhookUrl: string;
}

export interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<PaymentVerifyResult>;
}

// ──── CIB / Edahabia (Algeria) ────
// Stub for production integration with CIB/Edahabia payment gateway.
// Requires: CIB_MERCHANT_ID, CIB_API_KEY, CIB_TERMINAL_ID

export class CIBPaymentProvider implements PaymentProvider {
  async createPayment(_params: CreatePaymentParams): Promise<PaymentResult> {
    if (!process.env.CIB_MERCHANT_ID) {
      console.warn('[PAYMENT] CIB provider not configured — returning stub');
      return { success: false, error: 'CIB_PAYMENT_NOT_CONFIGURED' };
    }
    // Production: call CIB/Edahabia API to create payment
    console.warn('[PAYMENT] CIB provider not fully integrated — returning stub');
    return { success: false, error: 'CIB_PAYMENT_NOT_CONFIGURED' };
  }

  async verifyPayment(_transactionId: string): Promise<PaymentVerifyResult> {
    if (!process.env.CIB_MERCHANT_ID) {
      console.warn('[PAYMENT] CIB provider not configured — cannot verify');
      return { verified: false };
    }
    // Production: verify transaction status with CIB API
    console.warn('[PAYMENT] CIB provider not fully integrated — cannot verify');
    return { verified: false };
  }
}

// ──── Stripe (international fallback) ────
// Requires: STRIPE_SECRET_KEY

export class StripePaymentProvider implements PaymentProvider {
  async createPayment(_params: CreatePaymentParams): Promise<PaymentResult> {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('[PAYMENT] Stripe not configured');
      return { success: false, error: 'STRIPE_NOT_CONFIGURED' };
    }
    // Production: create Stripe Checkout Session and return session URL
    console.warn('[PAYMENT] Stripe not fully integrated — returning stub');
    return { success: false, error: 'STRIPE_NOT_CONFIGURED' };
  }

  async verifyPayment(_transactionId: string): Promise<PaymentVerifyResult> {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('[PAYMENT] Stripe not configured — cannot verify');
      return { verified: false };
    }
    // Production: retrieve Stripe PaymentIntent to verify status
    console.warn('[PAYMENT] Stripe not fully integrated — cannot verify');
    return { verified: false };
  }
}

// ──── Provider Factory ────

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || 'cib';
  if (provider === 'stripe') return new StripePaymentProvider();
  return new CIBPaymentProvider();
}
