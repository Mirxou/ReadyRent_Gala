export interface WalletTransaction {
  id: string | number;
  type: string;
  amount: number;
  date: string;
  note?: string;
  hash?: string;
}

export interface WalletBooking {
  id: string | number;
  status: string;
  escrow_status?: string;
  deposit_amount?: number;
  total_price?: number;
  product_name?: string;
  end_date?: string;
}

export interface WalletPayment {
  id: string | number;
  amount: number;
  created_at: string;
  status: string;
  method?: string;
  escrow_status?: string;
}

export interface WalletUserProfile {
  wallet_balance?: number;
  is_verified?: boolean;
  trust_score?: number;
}

export interface WalletBarChart {
  values: number[];
  max: number;
  normalized: number[];
}
