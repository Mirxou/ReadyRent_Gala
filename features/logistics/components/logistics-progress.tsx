'use client';

import { Truck } from 'lucide-react';

interface LogisticsProgressProps {
  bookingId?: string;
  status?: string;
}

export function LogisticsProgress({ status: _status }: LogisticsProgressProps) {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-4 h-4 text-sovereign-gold" />
        <span className="text-xs font-bold">تتبع التوصيل</span>
      </div>
      <div className="space-y-2">
        {['تم التأكيد', 'قيد التحضير', 'تم التوصيل'].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${i < 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />
            <span className={`text-[11px] ${i < 1 ? 'text-foreground' : 'text-muted-foreground/50'}`}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}