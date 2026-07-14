'use client';

import { Shield, Award, CheckCircle2 } from 'lucide-react';

export function TrustAssuranceChips({ trustScore = 0, isVerified = false, className = '' }: { trustScore?: number; isVerified?: boolean; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {isVerified && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
          <CheckCircle2 className="h-3 w-3" /> موثّق
        </span>
      )}
      {trustScore >= 80 && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sovereign-gold/10 text-sovereign-gold text-xs font-medium">
          <Award className="h-3 w-3" /> مستوى ثقة عالي
        </span>
      )}
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-muted-foreground text-xs">
        <Shield className="h-3 w-3" /> نقاط الثقة: {trustScore}
      </span>
    </div>
  );
}
