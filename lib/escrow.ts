// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Escrow Money Math (GRAFT: كراء بلا همّ P0)
// Pure functions — no I/O. The single source of truth for every
// DZD number the escrow system prints, holds, or deducts.
// ═══════════════════════════════════════════════════════════════

/** Late fee accrues at 30% of the product's daily rate, per late day. */
export const LATE_FEE_DAILY_RATE = 0.3;

/**
 * Sovereign deposit rule (PHASE 2): the collateral actually captured at
 * checkout. An explicit product deposit wins; otherwise 30% of the rental
 * basis — the same 30% the platform's own calculate-deposit endpoint calls
 * "Sovereign trust system". One number, one rule, everywhere.
 */
export const SOVEREIGN_DEPOSIT_RATE = 0.3;

export function computeDepositHeld(
  productDepositAmount: number | null | undefined,
  rentalBasis: number
): number {
  const explicit = Math.round(Math.max(0, productDepositAmount ?? 0));
  if (explicit > 0) return explicit;
  return Math.ceil(Math.max(0, rentalBasis) * SOVEREIGN_DEPOSIT_RATE);
}

export interface QuoteBreakdown {
  rentalTotal: number; // pricePerDay × days
  depositAmount: number; // held, not earned
  insuranceFee: number; // optional
  grandTotal: number; // what the customer actually pays now
}

export function countDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export function quoteBreakdown(
  pricePerDay: number,
  days: number,
  depositAmount: number,
  insuranceFee = 0
): QuoteBreakdown {
  const rentalTotal = pricePerDay * days;
  const deposit = Math.max(0, Math.round(depositAmount));
  const insurance = Math.max(0, Math.round(insuranceFee));
  return {
    rentalTotal,
    depositAmount: deposit,
    insuranceFee: insurance,
    grandTotal: rentalTotal + deposit + insurance,
  };
}

/** Daily late fee, frozen from the daily rental rate at capture time. */
export function computeLateFeePerDay(pricePerDay: number): number {
  return Math.round(Math.max(0, pricePerDay) * LATE_FEE_DAILY_RATE);
}

/**
 * Accrued late fee for `daysLate` days, capped at the deposit actually held.
 * The customer can never owe more late fees than the escrow can absorb —
 * disputes stay inside the money we already have.
 */
export function computeAccruedLateFee(
  daysLate: number,
  lateFeePerDay: number,
  depositHeld: number
): number {
  if (daysLate <= 0 || lateFeePerDay <= 0) return 0;
  const raw = daysLate * lateFeePerDay;
  return Math.min(raw, Math.max(0, depositHeld));
}

/** Deposit actually returned = held minus absorbed late fees (never negative). */
export function computeDepositReturn(depositHeld: number, lateFee: number): number {
  return Math.max(0, depositHeld - Math.max(0, lateFee));
}

export function formatDZD(amount: number): string {
  return `${new Intl.NumberFormat('fr-DZ').format(Math.round(amount))} دج`;
}
