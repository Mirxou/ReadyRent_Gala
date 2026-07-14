'use client';

import { Loader2 } from 'lucide-react';

interface DignifiedLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DignifiedLoader({ text = 'جاري التحميل...', size = 'md' }: DignifiedLoaderProps) {
  const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className={`${sizeMap[size]} animate-spin text-sovereign-gold`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
