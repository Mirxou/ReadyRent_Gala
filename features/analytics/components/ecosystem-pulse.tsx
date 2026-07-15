'use client';

import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Activity } from 'lucide-react';

export function EcosystemPulse() {
  return (
    <GlassPanel className="p-6 rounded-2xl" variant="default">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <h4 className="text-sm font-bold">نبض النظام البيئي</h4>
          <p className="text-[10px] text-muted-foreground">رصد حي للمنصة</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-black text-sovereign-gold">--</div>
          <div className="text-[10px] text-muted-foreground">مستخدم نشط</div>
        </div>
        <div>
          <div className="text-2xl font-black text-emerald-500">--</div>
          <div className="text-[10px] text-muted-foreground">حجز اليوم</div>
        </div>
        <div>
          <div className="text-2xl font-black text-amber-500">--</div>
          <div className="text-[10px] text-muted-foreground">تقييم جديد</div>
        </div>
      </div>
    </GlassPanel>
  );
}