import { apiFetch } from './core';

export interface Appeal {
  id: string;
  judgment_id: string;
  dispute_id: string;
  appellant_id: string;
  reason: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'resolved';
  outcome?: string;
  filed_at: string;
  resolved_at?: string;
}

export const appealsApi = {
  fileAppeal: (disputeId: string, reason: string) =>
    apiFetch(`disputes/${disputeId}/appeal/`, { method: 'POST', body: { reason } }),
  listMyAppeals: (params?: { page?: number; status?: string }) =>
    apiFetch('disputes/appeals/', { params }),
  getAppeal: (appealId: string) =>
    apiFetch(`disputes/appeals/${appealId}/`),
  submitAppealEvidence: (appealId: string, notes: string) =>
    apiFetch(`disputes/appeals/${appealId}/submit_evidence/`, { method: 'POST', body: { notes } }),
};
