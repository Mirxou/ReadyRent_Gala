'use client';

import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';

export function HighCourtMonitor() {
  const stats = [
    { label: 'نزاعات نشطة', value: '--', icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'تم البت', value: '--', icon: ShieldCheck, color: 'text-emerald-500' },
  ];

  return (
    <GlassPanel className="p-6 rounded-2xl" variant="default">
      <h4 className="text-sm font-bold mb-4">مراقبة النزاعات العليا</h4>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <div className="text-xl font-black">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}