// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Payment Security Layer
// HMAC signing, payment intent verification, escrow state machine
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';

const HMAC_SECRET = process.env.PAYMENT_HMAC_SECRET || `std_rent_prod_${process.env.NODE_ENV || 'dev'}`;
const HMAC_ALGORITHM = 'sha256';
const INTENT_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// ──── Types ────
export interface PaymentIntentData {
  bookingId: string;
  amount: number;
  method: string;
  userId: string;
  timestamp: number;
}

export interface PaymentIntentResult {
  hmac: string;
  expiresAt: string;
  timestamp: number;
}

// ──── 1. HMAC Sign a Payment Intent ────
// Creates a tamper-proof signature for a payment request.
// Any change to amount, booking, or user invalidates the signature.
export function signPaymentIntent(data: PaymentIntentData): PaymentIntentResult {
  const payload = `${data.bookingId}:${data.amount}:${data.method}:${data.userId}:${data.timestamp}`;
  const hmac = crypto
    .createHmac(HMAC_ALGORITHM, HMAC_SECRET)
    .update(payload)
    .digest('hex');

  return {
    hmac,
    expiresAt: new Date(data.timestamp + INTENT_EXPIRY_MS).toISOString(),
    timestamp: data.timestamp,
  };
}

// ──── 2. Verify a Payment Intent ────
// Returns true only if the HMAC matches AND the intent hasn't expired.
export function verifyPaymentIntent(
  hmac: string,
  data: PaymentIntentData
): boolean {
  // Check expiration first
  const now = Date.now();
  if (now - data.timestamp > INTENT_EXPIRY_MS) {
    return false;
  }

  const payload = `${data.bookingId}:${data.amount}:${data.method}:${data.userId}:${data.timestamp}`;
  const expected = crypto
    .createHmac(HMAC_ALGORITHM, HMAC_SECRET)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

// ──── 3. Escrow Status State Machine ────
// Enforces legal status transitions to prevent unauthorized fund release.
// Roles: renter, vendor, admin (admin can do anything)

type EscrowStatus =
  | 'none'
  | 'held'
  | 'released'
  | 'refunded'
  | 'partial_refund';

type EscrowRole = 'renter' | 'vendor' | 'admin';

// Allowed transitions: [current] → [new] → [authorized roles]
const ESCROW_TRANSITIONS: Record<string, Record<string, EscrowRole[]>> = {
  none: {
    held: ['admin'], // Only admin/system can move to held (after payment confirmation)
  },
  held: {
    released: ['vendor', 'admin'],   // Vendor confirms delivery, or admin resolves dispute
    refunded: ['admin'],              // Admin resolves dispute in renter favor
    partial_refund: ['admin'],        // Admin compromise
  },
  released: {},     // Terminal state
  refunded: {},      // Terminal state
  partial_refund: {}, // Terminal state
};

export function canTransitionEscrow(
  currentStatus: EscrowStatus,
  newStatus: EscrowStatus,
  role: EscrowRole
): boolean {
  // Admin can always transition
  if (role === 'admin') {
    // But still must follow the transition graph
    const allowedTargets = ESCROW_TRANSITIONS[currentStatus];
    if (!allowedTargets) return false;
    return newStatus in allowedTargets;
  }

  const allowedTargets = ESCROW_TRANSITIONS[currentStatus];
  if (!allowedTargets) return false;

  const allowedRoles = allowedTargets[newStatus];
  if (!allowedRoles) return false;

  return allowedRoles.includes(role);
}

export function getAllowedEscrowTransitions(
  currentStatus: EscrowStatus
): EscrowStatus[] {
  return Object.keys(ESCROW_TRANSITIONS[currentStatus] || {}) as EscrowStatus[];
}

// ──── 4. Payment Fingerprint ────
// Creates a tamper-detectable fingerprint for payment records.
// Can be verified later to detect if amount or booking was altered.
export function generatePaymentFingerprint(
  bookingId: string,
  amount: number,
  currency: string = 'DZD'
): string {
  const payload = `${bookingId}:${amount}:${currency}`;
  return crypto
    .createHash('sha256')
    .update(payload + HMAC_SECRET)
    .digest('hex')
    .slice(0, 16);
}

export function verifyPaymentFingerprint(
  fingerprint: string,
  bookingId: string,
  amount: number,
  currency: string = 'DZD'
): boolean {
  const expected = generatePaymentFingerprint(bookingId, amount, currency);
  return fingerprint === expected;
}
