'use client';

import { Scale, ShieldCheck } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';

export function JudicialLedger() {
  return (
    <GlassPanel className="p-8 rounded-2xl" variant="default">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-sovereign-gold/10 flex items-center justify-center">
          <Scale className="w-6 h-6 text-sovereign-gold" />
        </div>
        <div>
          <h2 className="text-xl font-black">السجل القضائي</h2>
          <p className="text-xs text-muted-foreground">سجلات النزاعات والبتود القضائية</p>
        </div>
      </div>
      <div className="text-center py-12 text-muted-foreground/50">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">لا توجد سجلات قضائية حالياً</p>
      </div>
    </GlassPanel>
  );
}