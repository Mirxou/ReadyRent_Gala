// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Trust Score Calculation (MVP)
// Step 2.2: isVerified(+30) + avgRating(+25) + vouches(+15) = max 70
// ═══════════════════════════════════════════════════════════════

/** Trust tier levels per Step 2.2 spec */
export type TrustTier = 'untrusted' | 'beginner' | 'trusted' | 'highly_trusted' | 'fully_trusted';

export interface TrustLevelInfo {
  tier: TrustTier;
  label: string;
  labelEn: string;
  color: string;       // Tailwind text color class
  bgColor: string;     // Tailwind bg color class
  borderColor: string; // Tailwind border color class
  icon: string;
}

/**
 * Trust level thresholds from 03-TRUST-SAFETY-SYSTEM.md 2.1.2
 *
 * 0-20  → untrusted      🔴 أحمر
 * 21-40 → beginner        🟡 أصفر
 * 41-60 → trusted         🟢 أخضر
 * 61-80 → highly_trusted  🟢 أخضر +
 * 81-100 → fully_trusted  🟢 أخضر ++
 */
const TRUST_LEVELS: TrustLevelInfo[] = [
  {
    tier: 'untrusted',
    label: 'غير موثوق',
    labelEn: 'Untrusted',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: '🔴',
  },
  {
    tier: 'beginner',
    label: 'مبتدئ',
    labelEn: 'Beginner',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: '🟡',
  },
  {
    tier: 'trusted',
    label: 'موثوق',
    labelEn: 'Trusted',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: '🟢',
  },
  {
    tier: 'highly_trusted',
    label: 'موثوق بدرجة عالية',
    labelEn: 'Highly Trusted',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: '✨',
  },
  {
    tier: 'fully_trusted',
    label: 'موثوق تمامًا',
    labelEn: 'Fully Trusted',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: '🏆',
  },
];

/**
 * Get trust level info from a score value.
 */
export function getTrustLevel(score: number): TrustLevelInfo {
  if (score >= 81) return TRUST_LEVELS[4];
  if (score >= 61) return TRUST_LEVELS[3];
  if (score >= 41) return TRUST_LEVELS[2];
  if (score >= 21) return TRUST_LEVELS[1];
  return TRUST_LEVELS[0];
}

/**
 * Input data needed to calculate a user's trust score.
 */
export interface TrustScoreInput {
  isVerified: boolean;
  /** Average rating from received reviews (1-5 scale) */
  avgRating: number;
  /** Total number of received reviews */
  reviewCount: number;
  /** Number of community vouches received */
  vouchCount: number;
}

/**
 * Calculate trust score using the MVP algorithm.
 *
 * Components (max 70 points for MVP):
 * - KYC verification: +30 if verified
 * - Average rating:   min(25, avgRating / 5 * 25)  → 5.0★ = 25 pts
 * - Community vouches: min(15, vouchCount * 3)    → 5 vouches = 15 pts
 *
 * The remaining 30 points (to reach 100) come from components
 * added in later steps (judicial record, escrow history, account age).
 */
export function calculateTrustScore(input: TrustScoreInput): number {
  let score = 0;

  // 1. KYC verification: +30
  if (input.isVerified) {
    score += 30;
  }

  // 2. Average rating: max 25 points
  //    Formula: (avgRating / 5) * 25, but only if there are reviews
  if (input.reviewCount > 0 && input.avgRating > 0) {
    const ratingScore = (input.avgRating / 5) * 25;
    score += Math.min(25, Math.round(ratingScore));
  }

  // 3. Community vouches: max 15 points
  //    Formula: vouchCount * 3, capped at 15
  if (input.vouchCount > 0) {
    score += Math.min(15, input.vouchCount * 3);
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate the trust score breakdown for display.
 */
export interface TrustScoreBreakdown {
  verification: number;   // 0 or 30
  rating: number;         // 0-25
  vouches: number;        // 0-15
  overall: number;        // 0-100 (capped, may be < 70 for MVP)
  level: TrustLevelInfo;
}

export function calculateTrustBreakdown(input: TrustScoreInput): TrustScoreBreakdown {
  const verification = input.isVerified ? 30 : 0;

  let rating = 0;
  if (input.reviewCount > 0 && input.avgRating > 0) {
    rating = Math.min(25, Math.round((input.avgRating / 5) * 25));
  }

  const vouches = input.vouchCount > 0 ? Math.min(15, input.vouchCount * 3) : 0;

  const overall = Math.max(0, Math.min(100, verification + rating + vouches));

  return {
    verification,
    rating,
    vouches,
    overall,
    level: getTrustLevel(overall),
  };
}
