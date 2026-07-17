'use client';

import { ShieldCheck, BadgeCheck, Award, Star } from 'lucide-react';

interface SovereignSealProps {
  verified?: boolean;
  type?: 'vendor' | 'product' | 'user' | 'contract';
  refId?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SovereignSeal({ verified = true, type = 'vendor', refId, animate = false, size = 'sm', className = '' }: SovereignSealProps) {
  if (!verified) return null;

  const sizeMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
  const Icon = type === 'product' ? Star : type === 'user' ? Award : type === 'contract' ? BadgeCheck : ShieldCheck;
  
  const animClass = animate ? 'animate-pulse' : '';

  return (
    <div className={`inline-flex items-center gap-1.5 text-green-400 ${animClass} ${className}`}>
      <Icon className={sizeMap[size]} />
      <span className="text-xs font-medium">موثّق</span>
    </div>
  );
}