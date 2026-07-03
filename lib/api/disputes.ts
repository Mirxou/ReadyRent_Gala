import { sovereignClient } from './sovereign-client';
import { SovereignResponse, DisputeStatus, MediationOffer } from '@/types/sovereign';

export interface Dispute {
  id: number;
  booking_id: number;
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
  listDisputes: (params?: any) =>
    sovereignClient.get<Dispute[]>('/disputes/disputes/', { params }),

  getDispute: (id: number) =>
    sovereignClient.get<Dispute>(`/disputes/disputes/${id}/`),

  initiateDispute: (data: {
    booking_id: number;
    claim_type: string;
    description: string;
    evidence_urls?: string[];
  }) =>
    sovereignClient.post<Dispute>('/disputes/disputes/create/', data),

  getDisputeStatus: (id: number) =>
    sovereignClient.get<DisputeStatus>(`/disputes/disputes/${id}/status/`),

  getDisputeVerdict: (id: number) =>
    sovereignClient.get<any>(`/disputes/disputes/${id}/verdict/`),

  /**
   * Get the full phase history of a dispute from the backend.
   * Replaces the "Mock stages" in DisputeDetail.
   */
  getDisputeHistory: (id: number) =>
    sovereignClient.get<DisputeHistoryStage[]>(`/disputes/disputes/${id}/history/`),

  // Messaging & Evidence
  createMessage: (disputeId: number, message: string, attachments: string[] = []) =>
    sovereignClient.post<any>(`/disputes/disputes/${disputeId}/messages/`, { message, attachments }),

  getEvidenceLogs: (disputeId: number) =>
    sovereignClient.get<any[]>(`/disputes/disputes/${disputeId}/evidence/`),

  /**
   * Upload a real evidence file to the backend.
   * Uses multipart/form-data (not JSON).
   */
  uploadEvidence: async (disputeId: number, file: File): Promise<any> => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dispute', String(disputeId));

    const response = await fetch(`${API_BASE}/api/disputes/disputes/${disputeId}/evidence/upload/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.detail || 'فشل رفع الدليل');
    }
    return response.json();
  },

  // Mediation
  getMediationOffers: (disputeId: number) =>
    sovereignClient.get<MediationOffer[]>(`/disputes/disputes/${disputeId}/mediation/offers/`),

  acceptOffer: (offerId: number) =>
    sovereignClient.post<any>(`/disputes/mediation/offers/${offerId}/accept/`),

  // Appeals
  fileAppeal: (judgmentId: number, reason: string) =>
    sovereignClient.post<any>(`/disputes/judgments/${judgmentId}/appeal/`, { reason }),

  // Public Judicial Ledger
  getPublicLedger: (params?: { page?: number; page_size?: number }) =>
    sovereignClient.get<any>('/disputes/public-ledger/', { params }),
};

export const supportApi = {
  listTickets: (params?: any) => 
    sovereignClient.get<any[]>('/disputes/tickets/', { params }),
  
  createTicket: (data: any) => 
    sovereignClient.post<any>('/disputes/tickets/create/', data),
  
  getTicket: (id: number) => 
    sovereignClient.get<any>(`/disputes/tickets/${id}/`),
  
  createTicketMessage: (ticketId: number, message: string) => 
    sovereignClient.post<any>(`/disputes/tickets/${ticketId}/messages/`, { message }),
};
