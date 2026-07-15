'use client';

import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Activity } from 'lucide-react';

export function SovereignPredictivePulse() {
  return (
    <GlassPanel className="p-6 rounded-2xl" variant="default">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-sovereign-gold/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-sovereign-gold" />
        </div>
        <div>
          <h4 className="text-sm font-bold">نبض التنبؤات السيادية</h4>
          <p className="text-[10px] text-muted-foreground">تحليلات ذكية قادمة</p>
        </div>
      </div>
      <div className="flex items-center justify-center py-8 text-muted-foreground/50 text-xs">
        قيد التطوير
      </div>
    </GlassPanel>
  );
}