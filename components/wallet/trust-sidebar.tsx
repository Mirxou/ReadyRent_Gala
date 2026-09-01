'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Lock } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { IdentityShield } from '@/shared/components/sovereign/identity-shield';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import type { WalletUserProfile, WalletBarChart } from './types';

interface TrustSidebarProps {
  userProfile: WalletUserProfile | null;
  trustDiscount: number;
  totalExpenses: number;
  totalReleased: number;
  expenseChart: WalletBarChart;
  releaseChart: WalletBarChart;
}

function MiniBarChart({ chart, color }: { chart: WalletBarChart; color: string }) {
  if (chart.values.length === 0) return <span className="text-[10px] text-muted-foreground/30">—</span>;
  return (
    <div className="w-1/2 h-8 flex items-end gap-1">
      {chart.normalized.map((val, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${val * 100}%` }}
          className={`flex-1 rounded-t-sm ${color}`}
        />
      ))}
    </div>
  );
}

export function TrustSidebar({
  userProfile,
  trustDiscount,
  totalExpenses,
  totalReleased,
  expenseChart,
  releaseChart,
}: TrustSidebarProps) {
  return (
    <div className="space-y-8">
      {/* Trust Reward Card */}
      <GlassPanel className="p-8 border-l-4 border-l-emerald-500 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="flex flex-col items-center text-center relative z-10">
          <IdentityShield status={userProfile?.is_verified ? 'verified' : 'unverified'} showLabel={false} trustScore={userProfile?.trust_score || 0} className="w-20 h-20 mb-6" />
          <h4 className="text-lg font-black mb-2 italic">امتيازات النخبة السيادية</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-8 opacity-60">
            بناءً على سجل معاملتكم الرقمية المعاصرة، يتم تطبيق بروتوكول الخصم الآلي.
          </p>

          <div className="w-full p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-2">Active Sovereign Discount</p>
            <div className="flex items-baseline justify-center gap-2">
              <p className="text-5xl font-black text-emerald-500 tracking-tighter">-{trustDiscount}%</p>
              <span className="text-[10px] font-bold text-emerald-600/60 uppercase">Deduction</span>
            </div>
            {trustDiscount === 0 && <p className="text-[10px] text-muted-foreground/40 mt-2">ارفع رصيد الثقة للحصول على خصومات</p>}
          </div>
        </div>
      </GlassPanel>

      {/* Analytics Peak */}
      <GlassPanel className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h4 className="font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sovereign-gold" /> نبض الرصيد
          </h4>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">Last 30 Days</Badge>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-bold">إجمالي المصاريف</span>
              <span className="text-xl font-black">{formatNumber(totalExpenses)} <span className="text-xs">DA</span></span>
            </div>
            <MiniBarChart chart={expenseChart} color="bg-sovereign-gold/20" />
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground font-bold">الضمانات المستردة</span>
              <span className="text-xl font-black">{formatNumber(totalReleased)} <span className="text-xs">DA</span></span>
            </div>
            <MiniBarChart chart={releaseChart} color="bg-emerald-500/20" />
          </div>
        </div>

        <SovereignButton variant="secondary" size="sm" className="w-full mt-10">
          تقرير مالي مفصل
        </SovereignButton>
      </GlassPanel>

      {/* Sovereign Shield */}
      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-sovereign-gold/30 to-black border border-white/5 relative overflow-hidden shadow-2xl">
        <Sparkles className="absolute top-4 left-4 w-4 h-4 text-sovereign-gold/40" />
        <Lock className="w-10 h-10 text-sovereign-gold mb-6" />
        <h4 className="text-white font-bold mb-2">تأمين Standard المطلق</h4>
        <p className="text-[11px] text-white/50 leading-relaxed">
          جميع معاملاتك المالية محمية بنظام تشفير سيادي وفريق أمني يعمل على مدار الساعة.
        </p>
      </div>
    </div>
  );
}
