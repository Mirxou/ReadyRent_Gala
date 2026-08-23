export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'ai_approved'
  | 'community_review'
  | 'verified'
  | 'ai_rejected'
  | 'rejected'
  | 'loading';

export interface VerificationData {
  status: VerificationStatus;
  ai_score?: number;
  ai_quality?: string;
  ai_issues?: string[];
  approval_count?: number;
  required_approvals?: number;
  approvals?: Array<{ id: string; voter_name: string; voted_at: string; comment?: string }>;
  rejection_reason?: string;
  face_photo_url?: string;
  submitted_at?: string;
}

export interface PendingVerification {
  id: string;
  user_name: string;
  face_photo_url: string;
  ai_score: number;
  approval_count: number;
  required_approvals: number;
  submitted_at: string;
}

export function mapPendingVerification(raw: Record<string, unknown>): PendingVerification {
  const user = raw.user as Record<string, string> | undefined;
  const name = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'مستخدم';
  return {
    id: raw.id as string,
    user_name: name,
    face_photo_url: raw.face_photo as string || '',
    ai_score: (raw.ai_score as number) || 0,
    approval_count: (raw.approval_count as number) || 0,
    required_approvals: (raw.required_approvals as number) || 5,
    submitted_at: raw.created_at as string || '',
  };
}

export function getStatusConfig(status: VerificationStatus) {
  switch (status) {
    case 'verified':
      return { icon: 'ShieldCheck', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'تم التوثيق' };
    case 'ai_rejected':
    case 'rejected':
      return { icon: 'ShieldX', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'مرفوض' };
    case 'pending':
    case 'ai_approved':
    case 'community_review':
      return { icon: 'Clock', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'قيد المراجعة' };
    default:
      return { icon: 'Shield', color: 'text-sovereign-gold', bgColor: 'bg-sovereign-gold/10', borderColor: 'border-sovereign-gold/30', badgeColor: 'bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/30', label: 'غير مُقدَّم' };
  }
}
