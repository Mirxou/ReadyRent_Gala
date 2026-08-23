export type TabKey = 'balance' | 'deposit' | 'transfer';
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
