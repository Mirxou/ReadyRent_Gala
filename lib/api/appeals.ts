import { sovereignClient } from './sovereign-client';

export interface Appeal {
  id: number;
  judgment_id: number;
  dispute_id: number;
  appellant_id: number;
  reason: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'resolved';
  outcome?: string;
  filed_at: string;
  resolved_at?: string;
}

export interface Judgment {
  id: number;
  dispute_id: number;
  verdict: 'full_renter' | 'full_owner' | 'split' | 'dismissed';
  ruling_text: string;
  renter_share?: number;
  owner_share?: number;
  is_final: boolean;
  finalized_at?: string;
  judge_name?: string;
  appeal_deadline?: string;
}

export interface JudicialRecord {
  id: number;
  dispute_id: number;
  event_type: string;
  description: string;
  actor?: string;
  timestamp: string;
  blockchain_hash?: string;
}

export interface AnonymizedCase {
  id: number;
  case_reference: string;
  category: string;
  verdict: string;
  ruling_summary: string;
  resolution_time_days: number;
  filed_at: string;
}

export const appealsApi = {
  /** File an appeal against a judgment */
  fileAppeal: (judgmentId: number, reason: string) =>
    sovereignClient.post<Appeal>(`/disputes/judgments/${judgmentId}/appeal/`, {
      reason,
    }),

  /** List all appeals for the current user */
  listMyAppeals: (params?: { page?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', params.page.toString());
    if (params?.status) q.append('status', params.status);
    return sovereignClient.get<Appeal[]>(`/disputes/appeals/?${q.toString()}`);
  },

  /** Get a single appeal's detail */
  getAppeal: (appealId: number) =>
    sovereignClient.get<Appeal>(`/disputes/appeals/${appealId}/`),

  /** Submit additional evidence for an appeal */
  submitAppealEvidence: (appealId: number, notes: string) =>
    sovereignClient.post<any>(
      `/disputes/appeals/${appealId}/submit_evidence/`,
      { notes }
    ),
};

export const judgmentsApi = {
  /** Get a specific judgment */
  getJudgment: (judgmentId: number) =>
    sovereignClient.get<Judgment>(`/disputes/judgments/${judgmentId}/`),

  /** Get the judgment for a dispute */
  getDisputeJudgment: (disputeId: number) =>
    sovereignClient.get<Judgment>(
      `/disputes/disputes/${disputeId}/judgment/`
    ),

  /** Get full audit trail / timeline for a dispute */
  getAuditTrail: (disputeId: number) =>
    sovereignClient.get<JudicialRecord[]>(
      `/disputes/disputes/${disputeId}/audit-trail/`
    ),
};

export const judicialLedgerApi = {
  /** Public: list anonymized judicial decisions */
  listPublicCases: (params?: {
    page?: number;
    category?: string;
    verdict?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', params.page.toString());
    if (params?.category) q.append('category', params.category);
    if (params?.verdict) q.append('verdict', params.verdict);
    if (params?.search) q.append('search', params.search);
    return sovereignClient.get<AnonymizedCase[]>(
      `/disputes/public-ledger/?${q.toString()}`
    );
  },

  /** Public: get a single anonymized case */
  getPublicCase: (caseId: number) =>
    sovereignClient.get<AnonymizedCase>(`/disputes/public-ledger/${caseId}/`),

  /** Get platform-wide judicial statistics */
  getStats: () =>
    sovereignClient.get<{
      total_cases: number;
      resolved_cases: number;
      avg_resolution_days: number;
      verdict_distribution: Record<string, number>;
    }>('/disputes/judicial-stats/'),
};
