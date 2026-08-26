import { sovereignClient } from './sovereign-client';

export interface WalletBalance {
  available: number;
  escrow: number;
  total: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'payment_split';
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'disputed';
  amount: number;
  description: string;
  created_at: string;
  createdAt?: string; // alias used by TransactionHistory component
  reference_id?: string;
}

export const walletApi = {
  /**
   * Get current wallet balance (Available + Escrow)
   */
  getBalance: () => sovereignClient.get<WalletBalance>('/payments/wallet/balance/'),

  /**
   * Get transaction history
   */
  getTransactions: (params?: { page?: number; limit?: number; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);
    
    return sovereignClient.get<Transaction[]>(`/payments/wallet/transactions/?${searchParams.toString()}`);
  },

  /**
   * Initiate a wallet top-up (Simulated for Phase 3)
   */
  topUp: (amount: number, methodId: string) => 
    sovereignClient.post<{ success: boolean; transaction_id: string }>('/payments/wallet/top-up/', { 
      amount, 
      payment_method_id: methodId 
    }),

  /**
   * Get specific transaction details
   */
  getTransaction: (id: string) => 
    sovereignClient.get<Transaction>(`/payments/wallet/transactions/${id}/`),
};
