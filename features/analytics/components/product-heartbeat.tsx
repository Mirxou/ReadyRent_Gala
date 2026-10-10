'use client';

import { Activity } from 'lucide-react';

interface ProductHeartbeatProps {
  productId?: string;
  className?: string;
}

export function ProductHeartbeat({ productId: _productId, className }: ProductHeartbeatProps) {
  return (
    <div className={`flex items-center gap-2 text-muted-foreground text-xs ${className ?? ''}`}>
      <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
      <span>نشاط المنتج</span>
    </div>
  );
}