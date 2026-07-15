'use client';

import { ShieldCheck } from 'lucide-react';

interface SovereignSealProps {
  verified?: boolean;
  className?: string;
}

export function SovereignSeal({ verified = true, className = '' }: SovereignSealProps) {
  if (!verified) return null;
  return (
    <div className={`inline-flex items-center gap-1.5 text-green-400 ${className}`}>
      <ShieldCheck className="h-4 w-4" />
      <span className="text-xs font-medium">موثّق</span>
    </div>
  );
}
