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

  // Messaging & Evidence
  createMessage: (disputeId: number, message: string, attachments: string[] = []) => 
    sovereignClient.post<any>(`/disputes/disputes/${disputeId}/messages/`, { message, attachments }),
  
  getEvidenceLogs: (disputeId: number) => 
    sovereignClient.get<any[]>(`/disputes/disputes/${disputeId}/evidence/`),

  // Mediation
  getMediationOffers: (disputeId: number) => 
    sovereignClient.get<MediationOffer[]>(`/disputes/disputes/${disputeId}/mediation/offers/`),
  
  acceptOffer: (offerId: number) => 
    sovereignClient.post<any>(`/disputes/mediation/offers/${offerId}/accept/`),

  // Appeals
  fileAppeal: (judgmentId: number, reason: string) => 
    sovereignClient.post<any>(`/disputes/judgments/${judgmentId}/appeal/`, { reason }),
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
