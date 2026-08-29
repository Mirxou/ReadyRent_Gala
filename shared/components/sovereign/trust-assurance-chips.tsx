'use client';

import { Shield, Award, CheckCircle2 } from 'lucide-react';
import { getTrustLevel } from '@/lib/trust-score';

export function TrustAssuranceChips({ trustScore = 0, isVerified = false, className = '' }: { trustScore?: number; isVerified?: boolean; className?: string }) {
  const level = getTrustLevel(trustScore);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {isVerified && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
          <CheckCircle2 className="h-3 w-3" /> موثّق
        </span>
      )}
      {trustScore >= 61 ? (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
          <Award className="h-3 w-3" /> مستوى ثقة عالي
        </span>
      ) : trustScore >= 41 ? (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
          {level.icon} موثوق
        </span>
      ) : trustScore >= 21 ? (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
          {level.icon} مبتدئ
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
          {level.icon} مستوى ثقة منخفض
        </span>
      )}
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-muted-foreground text-xs">
        <Shield className="h-3 w-3" /> نقاط الثقة: {trustScore}
      </span>
    </div>
  );
}
