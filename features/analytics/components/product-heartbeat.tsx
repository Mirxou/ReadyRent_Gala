'use client';

import { Activity } from 'lucide-react';

interface ProductHeartbeatProps {
  productId?: string;
}

export function ProductHeartbeat({ productId }: ProductHeartbeatProps) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
      <span>نشاط المنتج</span>
    </div>
  );
}