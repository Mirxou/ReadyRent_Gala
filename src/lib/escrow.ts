// ─── Escrow / pricing / late-fee calculation helpers ─────────────────

export const LATE_FEE_DAILY_RATE = 0.3; // 30% of the daily rental rate per late day
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatDZD(amount: number): string {
  return `${new Intl.NumberFormat('ar-DZ', { maximumFractionDigits: 0 }).format(
    Math.round(amount),
  )} د.ج`;
}

export function countDays(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / MS_PER_DAY));
}

export function computeLateFeePerDay(dailyRate: number): number {
  return Math.round(dailyRate * LATE_FEE_DAILY_RATE);
}

/**
 * Late fee accrued so far for a booking that is past its endDate.
 * Accrues per full late day, capped at the deposit held in escrow.
 */
export function computeAccruedLateFee(input: {
  endDate: Date;
  lateFeePerDay: number;
  deposit: number;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const lateMs = now.getTime() - input.endDate.getTime();
  if (lateMs <= 0) return 0;
  const daysLate = Math.ceil(lateMs / MS_PER_DAY);
  return Math.min(input.deposit, daysLate * input.lateFeePerDay);
}

/**
 * Price breakdown shown to the customer BEFORE payment (P1 transparency):
 * rental + deposit (escrow) + insurance = total charged today.
 */
export function computeQuote(input: {
  dailyRate: number;
  days: number;
  deposit: number;
  insuranceFee: number;
}) {
  const rentalPrice = Math.round(input.dailyRate * input.days);
  const insuranceFee = Math.round(input.insuranceFee);
  const deposit = Math.round(input.deposit);
  const totalPrice = rentalPrice + deposit + insuranceFee;
  return { rentalPrice, deposit, insuranceFee, totalPrice };
}
