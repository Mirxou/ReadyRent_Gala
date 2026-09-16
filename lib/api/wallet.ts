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
   * Initiate a wallet deposit
   * NOTE: server accepts `method` (not `payment_method_id`).
   * The previous client sent `payment_method_id` which the server never read.
   */
  topUp: (amount: number, method?: string) =>
    sovereignClient.post<{ success: boolean; balance?: number; transaction_id: string }>('/wallet/deposit/', {
      amount,
      method,
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
   * Resolve a phone or email to a recipient user ID (CUID).
   * P1 fix: /api/wallet/transfer expects `recipient_id`, but the UI collects
   * phone/email from the user. This lookup bridges the gap.
   */
  resolveRecipient: (identifier: string) =>
    sovereignClient.get<{
      recipient_id: string;
      username: string | null;
      first_name: string | null;
      last_name: string | null;
      is_verified: boolean;
      trust_score: number;
    }>(`/wallet/resolve-recipient/?identifier=${encodeURIComponent(identifier)}`),

  /**
   * Initiate a wallet transfer to another user
   * P1 fix: server expects `recipient_id` (CUID), not `recipient_phone`.
   * The previous client sent `recipient_phone` and the server's Zod schema
   * (`walletTransferSchema.recipient_id: z.string().min(1)`) rejected it
   * with VALIDATION_ERROR every time.
   *
   * If the UI only has the recipient's phone, the caller must first resolve
   * it to a user ID via `walletApi.resolveRecipient`. For now, we expose `recipient_id`.
   */
  transfer: (amount: number, recipientId: string, note?: string) =>
    sovereignClient.post<{ success: boolean; balance?: number; transaction_id?: string }>('/wallet/transfer/', {
      amount,
      recipient_id: recipientId,
      ...(note ? { note } : {}),
    }),
};
