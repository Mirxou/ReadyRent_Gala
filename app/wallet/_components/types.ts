export type TabKey = 'balance' | 'deposit' | 'transfer' | 'payments';
export type DepositMode = 'deposit' | 'withdraw';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  date?: string;
  created_at?: string;
  note?: string;
  hash?: string;
}

/** A charged payment (Payment model) — from GET /api/payments/payments */
export interface PaymentItem {
  id: string;
  booking_id: string | null;
  amount: number;
  method: string;
  status: string; // pending | completed | failed | cancelled
  escrow_status: string | null; // held | released | refunded
  created_at: string;
}
