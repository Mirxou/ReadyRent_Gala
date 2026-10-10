// ═══════════════════════════════════════════════════════════════
// GRAFT PHASE 3 — Payout API client (كراء بلا همّ)
// Vendor withdrawal loop + admin processing queue.
// ═══════════════════════════════════════════════════════════════

import { sovereignClient } from './sovereign-client';

export interface VendorBalanceDTO {
  earned: number;
  committed: number;
  available: number;
  withdrawn: number;
  pending_requests: number;
}

export interface PayoutRequestDTO {
  id: string;
  amount: number;
  method: string;
  method_label?: string;
  account_name: string;
  account_number: string;
  status: string;
  admin_note?: string | null;
  transfer_ref?: string | null;
  processed_at?: string | null;
  created_at: string;
  vendor?: { id: string; name: string; name_ar: string } | null;
  user?: { id: string; email: string; first_name?: string; last_name?: string } | null;
}

export interface AdminPayoutStatsDTO {
  pending_count: number;
  pending_amount: number;
}

export const payoutsApi = {
  /** Vendor: balance + own requests (latest 50) */
  getMy: () =>
    sovereignClient.get<{
      vendor: { id: string; name: string; name_ar: string };
      balance: VendorBalanceDTO;
      min_payout: number;
      requests: PayoutRequestDTO[];
    }>('/vendors/payout-requests'),

  /** Vendor: create a withdrawal demand */
  create: (data: {
    amount: number;
    method: string;
    account_name: string;
    account_number: string;
  }) => sovereignClient.post('/vendors/payout-requests', data),

  /** Admin: processing queue */
  adminList: (params?: { status?: string; page?: number; limit?: number }) =>
    sovereignClient.get<{
      requests: PayoutRequestDTO[];
      pending_count: number;
      pending_amount: number;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>('/admin/payout-requests', { params }),

  /** Admin: state machine — approve | reject | mark_paid */
  adminAction: (
    id: string,
    data: { action: 'approve' | 'reject' | 'mark_paid'; note?: string; transfer_ref?: string }
  ) => sovereignClient.patch(`/admin/payout-requests/${id}`, data),
};
