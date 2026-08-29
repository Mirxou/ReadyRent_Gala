import { sovereignClient } from './sovereign-client';

export interface Dispute {
  id: string;
  booking_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  claimed_amount: number;
  created_at: string;
}

export interface DisputeHistoryStage {
  label_ar: string;
  label_en?: string;
  timestamp?: string;
  status: 'completed' | 'active' | 'pending';
  phase?: string;
}

export const disputesApi = {
  // Dispute Lifecycle
  listDisputes: (params?: Record<string, unknown>) =>
    sovereignClient.get<Dispute[]>('/disputes/', { params }),

  getDispute: (id: string) =>
    sovereignClient.get<Dispute>(`/disputes/${id}/`),

  initiateDispute: (data: {
    booking_id: string;
    claim_type: string;
    description: string;
    evidence_urls?: string[];
  }) =>
    sovereignClient.post<Dispute>('/disputes/create/', data),

  // TODO: route not yet implemented — /disputes/[id]/status
  // getDisputeStatus: (id: string) =>
  //   sovereignClient.get<DisputeStatus>(`/disputes/${id}/status/`),

  // TODO: route not yet implemented — /disputes/[id]/verdict
  // getDisputeVerdict: (id: string) =>
  //   sovereignClient.get<unknown>(`/disputes/${id}/verdict/`),

  /**
   * Get the full phase history of a dispute from the backend.
   * Replaces the "Mock stages" in DisputeDetail.
   */
  getDisputeHistory: (id: string) =>
    sovereignClient.get<DisputeHistoryStage[]>(`/disputes/${id}/history/`),

  // Messaging & Evidence
  createMessage: (disputeId: string, message: string, attachments: string[] = []) =>
    sovereignClient.post<unknown>(`/disputes/${disputeId}/messages/`, { message, attachments }),

  // TODO: route not yet implemented — /disputes/[id]/evidence
  // getEvidenceLogs: (disputeId: string) =>
  //   sovereignClient.get<unknown[]>(`/disputes/${disputeId}/evidence/`),

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
  //   sovereignClient.post<unknown>(`/disputes/mediation/offers/${offerId}/accept/`),

  // Appeals
  fileAppeal: (disputeId: string, reason: string) =>
    sovereignClient.post<unknown>(`/disputes/${disputeId}/appeal/`, { reason }),

  // Public Judicial Ledger
  getPublicLedger: (params?: { page?: number; page_size?: number }) =>
    sovereignClient.get<unknown>('/disputes/public-ledger/', { params }),
};

export const supportApi = {
  listTickets: (params?: Record<string, unknown>) =>
    sovereignClient.get<unknown[]>('/disputes/tickets/', { params }),

  createTicket: (data: Record<string, unknown>) =>
    sovereignClient.post<unknown>('/disputes/tickets/create/', data),

  getTicket: (id: string) =>
    sovereignClient.get<unknown>(`/disputes/tickets/${id}/`),

  createTicketMessage: (ticketId: string, message: string) =>
    sovereignClient.post<unknown>(`/disputes/tickets/${ticketId}/messages/`, { message }),
};
