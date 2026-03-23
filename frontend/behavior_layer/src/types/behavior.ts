
export type MeritScore = number; // 0-100
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DignityContext {
    violationCount: number;
    lastInteractionTime: number; // to calculate cooling-off
    isUnderCoolingOff: boolean;
}

export interface BehavioralContext {
    userId: string;
    merit: MeritScore;
    risk: RiskLevel;
    dignity: DignityContext;
}

export type InteractionType = 'SUBMIT_EVIDENCE' | 'ESCALATE_DISPUTE' | 'SEND_MESSAGE';

export interface InteractionResult {
    allowed: boolean;
    reason?: string; // Human-consumable reason for rejection/delay
    coolingOffRequired?: number; // Constraints in seconds
    nextAllowedInteraction?: number; // Timestamp
}
