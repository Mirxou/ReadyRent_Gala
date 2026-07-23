'use client';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';

export function SocialCommander() {
  return (
    <GlassPanel className="p-8" gradientBorder>
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-black text-sovereign-gold">مركز القيادة الاجتماعي</h2>
        <p className="text-muted-foreground">قريباً — نظام التواصل الاجتماعي السيادي</p>
      </div>
    </GlassPanel>
  );
}