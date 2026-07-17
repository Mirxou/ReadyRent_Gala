'use client';

import { Loader2 } from 'lucide-react';

interface DignifiedLoaderProps {
  text?: string;
  label?: string;
  subLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DignifiedLoader({ text, label, subLabel, size = 'md', className = '' }: DignifiedLoaderProps) {
  const displayText = label || text || 'جاري التحميل...';
  const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-sovereign-gold`} />
      {displayText && <p className="text-sm text-muted-foreground">{displayText}</p>}
      {subLabel && <p className="text-xs text-muted-foreground/70">{subLabel}</p>}
    </div>
  );
}