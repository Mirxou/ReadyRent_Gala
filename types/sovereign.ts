// Sovereign Response Types - matches SOVEREIGN_API_SPEC.md

export type SovereignStatus =
  | 'sovereign_halt'
  | 'sovereign_conditional'
  | 'sovereign_proceeding'
  | 'sovereign_wait'
  | 'sovereign_verdict'
  | 'sovereign_protection'
  // Client-side synthetic statuses (not from backend)
  | 'success'
  | 'error';

export type SovereignCode =
  | 'DIGNITY_COOLING_OFF'
  | 'STRUCTURED_FORM_REQUIRED'
  | 'JUDICIAL_PROCESS_INITIATED'
  | 'PROTECTIVE_REVIEW_IN_PROGRESS'
  | 'RESOLUTION_DELIVERED'
  | 'SYSTEM_HALT'
  // Client-side synthetic codes (not from backend)
  | 'NO_CONTENT'
  | 'CONNECTION_ERROR';

export interface SovereignResponse<T> {
  status: SovereignStatus;
  code: SovereignCode;
  dignity_preserved: boolean;
  timestamp?: string;
  message_ar?: string;
  message_en?: string;
  data: T;
  visual_assets?: VisualAssets;
  metadata?: Record<string, any>;
}

export interface VisualAssets {
  mode: 'MARKET' | 'DISPUTE' | 'VERDICT';
  seal?: {
    type: 'SHIELD_SILVER' | 'BALANCE_GOLD' | 'DOCUMENT_GREY';
    ref_id: string;
  };
  receipt?: {
    stages: ReceiptStage[];
  };
}

export interface ReceiptStage {
  label_ar: string;
  label_en?: string;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
}

export interface DisputeStatus {
  id: number;
  current_phase: string;
  waiting_type?: 'PROTECTIVE' | 'PROCEDURAL' | 'JUDGMENT';
  estimated_completion?: string;
  progress?: {
    current_stage: number;
    total_stages: number;
  };
}

export interface MediationOffer {
  id: number;
  amount: number;
  currency: string;
  reasoning: string;
  status: 'pending_review' | 'visible' | 'accepted' | 'rejected';
  created_at: string;
  precedents?: Array<{
    case_id: string;
    similarity_score: number;
  }>;
}
