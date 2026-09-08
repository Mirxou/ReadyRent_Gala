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
  getBalance: () => sovereignClient.get<WalletBalance>('/wallet/'),

  /**
   * Get transaction history
   */
  getTransactions: (params?: { page?: number; limit?: number; type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.type) searchParams.append('type', params.type);

    return sovereignClient.get<Transaction[]>(`/wallet/transactions/?${searchParams.toString()}`);
  },

  /**
   * Initiate a wallet deposit (actual route: /wallet/deposit/)
   */
  topUp: (amount: number, methodId?: string) =>
    sovereignClient.post<{ success: boolean; balance?: number; transaction_id: string }>('/wallet/deposit/', {
      amount,
      ...(methodId ? { payment_method_id: methodId } : {}),
    }),

  /**
   * Get wallet transactions (no single transaction route exists)
   */
  getTransaction: (id: string) =>
    sovereignClient.get<Transaction>(`/wallet/transactions/?id=${id}`),

  /**
   * Initiate a wallet withdrawal
   */
  withdraw: (amount: number, method?: string) =>
    sovereignClient.post<{ success: boolean; balance?: number; transaction_id?: string }>('/wallet/withdraw/', {
      amount,
      method,
    }),

  /**
   * Initiate a wallet transfer to another user
   */
  transfer: (amount: number, recipientPhone: string) =>
    sovereignClient.post<{ success: boolean; balance?: number; transaction_id?: string }>('/wallet/transfer/', {
      amount,
      recipient_phone: recipientPhone,
    }),
};
