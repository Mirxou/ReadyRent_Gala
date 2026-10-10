// ═══════════════════════════════════════════════════════════════
// GRAFT PHASE 3 — Payout Engine (كراء بلا همّ)
// Merchant withdrawal loop: the money-out valve of the escrow engine.
//
// Chargily Pay has NO payout API — their own code notes the "Yassir
// model". So the final leg of the 360° money path is human, and this
// engine's job is to make that human leg *accountable*:
//   · every dinar a vendor may withdraw is earned via PayoutRecord
//     (created at escrow release: rent + late-fee compensation);
//   · every dinar committed to leave is a PayoutRequest row;
//   · available balance is the difference — computed fresh inside
//     the same transaction that creates a request (no double-spend).
//
// Amounts are whole DZD integers — the SAME unit as booking.totalPrice
// and formatDZD(). (The `بالسنتات` comment on PayoutRecord.amount is a
// stale note; the actual data flow never divides by 100.)
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';

/** Minimum withdrawal — keeps manual transfer costs (admin time) sane. */
export const MIN_PAYOUT_AMOUNT = 1000; // DZD

/** Maximum withdrawal per request — mirrors reasonable manual transfer caps. */
export const MAX_PAYOUT_AMOUNT = 1_000_000; // DZD

export const PAYOUT_METHODS = ['ccp', 'baridimob', 'rib'] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  ccp: 'حساب بريدي (CCP)',
  baridimob: 'باريدي موب (RIP)',
  rib: 'حساب بنكي (RIB)',
};

export const PAYOUT_REQUEST_STATUSES = ['pending', 'approved', 'paid', 'rejected'] as const;
export type PayoutRequestStatus = (typeof PAYOUT_REQUEST_STATUSES)[number];

// ──── Pure helpers (testable, no DB) ────

/** Strip spaces/dashes — humans paste account numbers in every shape. */
export function normalizeAccountNumber(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

/**
 * Validate account identifier per method:
 *   · CCP        — 8..20 digits (account + clé)
 *   · baridimob  — exactly 20 digits (RIP)
 *   · rib        — exactly 20 digits (bank RIB)
 * Returns null when valid, otherwise an Arabic error message.
 */
export function validateAccountNumber(method: PayoutMethod, raw: string): string | null {
  const normalized = normalizeAccountNumber(raw);
  if (!/^\d+$/.test(normalized)) {
    return 'رقم الحساب يجب أن يحتوي أرقاماً فقط';
  }
  if (method === 'ccp') {
    if (normalized.length < 8 || normalized.length > 20) {
      return 'رقم الحساب البريدي (CCP) يجب أن يكون بين 8 و 20 رقماً';
    }
  } else if (normalized.length !== 20) {
    return method === 'baridimob'
      ? 'رقم RIP (باريدي موب) يجب أن يكون 20 رقماً'
      : 'رقم RIB يجب أن يكون 20 رقماً';
  }
  return null;
}

/** Available = earned (PayoutRecords not failed) − committed (requests not rejected). */
export function computeAvailableBalance(earned: number, committed: number): number {
  return Math.max(0, Math.max(0, earned) - Math.max(0, committed));
}

export function isPayoutMethod(value: unknown): value is PayoutMethod {
  return typeof value === 'string' && (PAYOUT_METHODS as readonly string[]).includes(value);
}

// ──── DB-backed balance ────

export interface VendorBalance {
  earned: number; // Σ PayoutRecord.amount (status != 'failed')
  committed: number; // Σ PayoutRequest.amount (status != 'rejected')
  available: number; // earned − committed (never negative)
  withdrawn: number; // Σ requests actually marked paid
  pendingRequests: number; // count of pending requests awaiting admin
}

/** Σ PayoutRecord.amount for this vendor — the escrow engine's IOU ledger. */
export async function getVendorEarnings(vendorId: string): Promise<number> {
  const agg = await db.payoutRecord.aggregate({
    _sum: { amount: true },
    where: { vendorId, status: { not: 'failed' } },
  });
  return agg._sum.amount ?? 0;
}

/** Σ PayoutRequest.amount not rejected — money already committed to leave. */
export async function getVendorCommitted(vendorId: string): Promise<number> {
  const agg = await db.payoutRequest.aggregate({
    _sum: { amount: true },
    where: { vendorId, status: { not: 'rejected' } },
  });
  return agg._sum.amount ?? 0;
}

export async function getVendorBalance(vendorId: string): Promise<VendorBalance> {
  const [earned, committed, paidAgg, pendingAgg] = await Promise.all([
    getVendorEarnings(vendorId),
    getVendorCommitted(vendorId),
    db.payoutRequest.aggregate({
      _sum: { amount: true },
      where: { vendorId, status: 'paid' },
    }),
    db.payoutRequest.count({ where: { vendorId, status: 'pending' } }),
  ]);
  return {
    earned,
    committed,
    available: computeAvailableBalance(earned, committed),
    withdrawn: paidAgg._sum.amount ?? 0,
    pendingRequests: pendingAgg,
  };
}

/**
 * Resolve the vendor record for a session user.
 * Primary: explicit Vendor.userId link. Fallback: full-name match — the same
 * legacy bridge the vendor dashboard API uses (vendors without linked users).
 */
export async function resolveVendorForUser(
  userId: string,
  fullName: string
): Promise<{ id: string; name: string; nameAr: string } | null> {
  const linked = await db.vendor.findFirst({
    where: { userId },
    select: { id: true, name: true, nameAr: true },
  });
  if (linked) return linked;

  if (!fullName) return null;
  const all = await db.vendor.findMany({
    select: { id: true, name: true, nameAr: true },
  });
  const matched = all.find(v => v.name === fullName || v.nameAr === fullName);
  return matched ?? null;
}
