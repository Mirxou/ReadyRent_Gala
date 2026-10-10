import { sovereignClient } from './sovereign-client';

export interface DisputeMessage {
  id?: string;
  type?: string;
  sender_id?: string | null;
  message?: string | null;
  created_at?: string;
  [key: string]: any;
}

export interface DisputeBookingInfo {
  id?: string;
  product_image?: string | null;
  product_name?: string | null;
  product?: { name_ar?: string | null; [key: string]: any } | null;
  total_price?: number | null;
  status?: string | null;
  [key: string]: any;
}

export interface Dispute {
  id: string;
  booking_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  claimed_amount: number;
  created_at: string;
  // Fields returned by the detail endpoint (dashboard + public detail pages)
  claim_type?: string | null;
  evidence_urls?: string[];
  messages?: DisputeMessage[];
  user_id?: string | null;
  user?: { first_name?: string | null; last_name?: string | null; [key: string]: any } | null;
  booking?: DisputeBookingInfo | null;
  updated_at?: string;
}

export interface DisputeHistoryStage {
  label_ar: string;
  label_en?: string;
  timestamp?: string;
  status: 'completed' | 'active' | 'pending';
  phase?: string;
}

/**
 * Row shape of /disputes/[id]/history/ — audit-log entries used by the
 * dashboard timeline builder (message / created_at / is_status_change).
 */
export interface DisputeHistoryEntry {
  phase?: string;
  label_ar?: string;
  timestamp?: string;
  description?: string;
  type?: string;
  message?: string;
  created_at: string;
  is_status_change?: boolean;
  status?: string;
  [key: string]: any;
}

export const disputesApi = {
  // Dispute Lifecycle
  listDisputes: (params?: Record<string, unknown>) =>
    sovereignClient.get<Dispute[]>('/disputes/', { params }),

  getDispute: (id: string) =>
    sovereignClient.get<Dispute>(`/disputes/${id}/`),

  initiateDispute: (data: {
    booking_id: string;
    title: string;
    reason: string;
    description?: string;
    claim_type: string;
    claimed_amount?: number;
    evidence_urls?: string[];
  }) =>
    sovereignClient.post<Dispute>('/disputes/create/', data),

  // TODO: route not yet implemented — /disputes/[id]/status
  // getDisputeStatus: (id: string) =>
  //   sovereignClient.get<DisputeStatus>(`/disputes/${id}/status/`),

  // TODO: route not yet implemented — /disputes/[id]/verdict
  // getDisputeVerdict: (id: string) =>
  //   sovereignClient.get<any>(`/disputes/${id}/verdict/`),

  /**
   * Get the full phase history of a dispute from the backend.
   * Replaces the "Mock stages" in DisputeDetail.
   */
  getDisputeHistory: (id: string) =>
    sovereignClient.get<DisputeHistoryEntry[]>(`/disputes/${id}/history/`),

  // Messaging & Evidence
  createMessage: (disputeId: string, message: string, _attachments: string[] = []) =>
    sovereignClient.post<any>(`/disputes/${disputeId}/messages/`, { content: message }),

  // TODO: route not yet implemented — /disputes/[id]/evidence
  // getEvidenceLogs: (disputeId: string) =>
  //   sovereignClient.get<any[]>(`/disputes/${disputeId}/evidence/`),

  /**
   * Upload a real evidence file to the backend.
   * Uses multipart/form-data (not JSON).
   */
  // TODO: route not yet implemented — /disputes/[id]/evidence/upload
  // uploadEvidence: async (disputeId: string, file: File): Promise<unknown> => {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   formData.append('dispute', String(disputeId));
  //   const response = await fetch(`/api/disputes/${disputeId}/evidence/upload/`, {
  //     method: 'POST',
  //     body: formData,
  //     credentials: 'include',
  //   });
  //   if (!response.ok) {
  //     const errorData = await response.json().catch(() => ({}));
  //     throw new Error(errorData?.detail || 'فشل رفع الدليل');
  //   }
  //   return response.json();
  // },

  // TODO: route not yet implemented — /disputes/[id]/mediation/offers
  // getMediationOffers: (disputeId: string) =>
  //   sovereignClient.get<MediationOffer[]>(`/disputes/${disputeId}/mediation/offers/`),

  // TODO: route not yet implemented — /disputes/mediation/offers/[id]/accept
  // acceptOffer: (offerId: string) =>
  //   sovereignClient.post<any>(`/disputes/mediation/offers/${offerId}/accept/`),

  // Appeals
  fileAppeal: (disputeId: string, data: { reason: string; description: string }) =>
    sovereignClient.post<any>(`/disputes/${disputeId}/appeal/`, data),

  // Public Judicial Ledger
  getPublicLedger: (params?: { page?: number; page_size?: number }) =>
    sovereignClient.get<any>('/disputes/public-ledger/', { params }),

  // green-sweep: referenced by disputes/steps/evidence-step.tsx but never landed
  // on main — the wizard step crashed at runtime calling undefined. Real endpoint
  // path restored; backend may need the matching route.
  uploadEvidence: (disputeId: string | number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return sovereignClient.post<{ url?: string; id?: string }>(`/disputes/${disputeId}/evidence`, form);
  },

  resolveDispute: (id: string, data: { resolution: 'approved' | 'rejected'; decision_note?: string }) =>
    sovereignClient.post<any>(`/disputes/${id}/resolve/`, data),
};

export const returnsApi = {
  listReturns: () =>
    sovereignClient.get<any[]>('/returns/'),

  createReturn: (data: {
    booking_id: string;
    reason: string;
    description?: string;
  }) =>
    sovereignClient.post<any>('/returns/create/', data),
};

export const supportApi = {
  listTickets: (params?: Record<string, unknown>) =>
    sovereignClient.get<any[]>('/disputes/tickets/', { params }),

  createTicket: (data: Record<string, unknown>) =>
    sovereignClient.post<any>('/disputes/tickets/create/', data),

  getTicket: (id: string) =>
    sovereignClient.get<any>(`/disputes/tickets/${id}/`),

  createTicketMessage: (ticketId: string, message: string) =>
    sovereignClient.post<any>(`/disputes/tickets/${ticketId}/messages/`, { message }),
};
