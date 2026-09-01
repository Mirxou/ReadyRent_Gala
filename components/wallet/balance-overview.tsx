'use client';

import { ArrowUpRight, ArrowDownLeft, Lock, Wallet } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignSparkle, SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { formatNumber } from '@/lib/utils';

interface BalanceOverviewProps {
  balance: number;
  escrowAmount: number;
  onDeposit: () => void;
  onWithdraw: () => void;
}

export function BalanceOverview({ balance, escrowAmount, onDeposit, onWithdraw }: BalanceOverviewProps) {
  return (
    <SovereignGlow color="gold">
      <GlassPanel className="p-10 relative overflow-hidden group h-full" gradientBorder>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sovereign-gold via-emerald-500 to-sovereign-gold opacity-30" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10 h-full">
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-4 opacity-40">Available Sovereign Liquidity</p>
              <h2 className="text-7xl font-black text-foreground tracking-tighter flex items-baseline gap-4 italic">
                <SovereignSparkle active={true}>
                  {formatNumber(balance)}
                </SovereignSparkle>
                <span className="text-2xl font-normal text-muted-foreground opacity-20 not-italic">DA</span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <SovereignButton variant="primary" size="lg" className="px-10 h-14 shadow-2xl shadow-sovereign-gold/10 rounded-2xl" withShimmer onClick={onDeposit}>
                <ArrowUpRight className="w-5 h-5 ml-2" /> شحن الخزانة
              </SovereignButton>
              <SovereignButton variant="secondary" size="lg" className="px-10 h-14 rounded-2xl" onClick={onWithdraw}>
                <ArrowDownLeft className="w-5 h-5 ml-2" /> سحب السيادة
              </SovereignButton>
            </div>
          </div>

          <div className="w-px h-32 bg-white/5 hidden md:block" />

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                <Lock className="w-3 h-3 text-sovereign-gold" /> Escrow Pipeline
              </p>
              <h3 className="text-4xl font-black text-sovereign-gold tracking-tight">
                {formatNumber(escrowAmount)} <span className="text-sm font-normal text-muted-foreground/40">DA</span>
              </h3>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-[200px] italic">
              &ldquo;أمان المجتمع محمي بضمانات فورية يتم فك حجزها آلياً عند انتهاء العقد.&rdquo;
            </p>
          </div>
        </div>

        <Wallet className="absolute -bottom-10 -right-10 w-48 h-48 text-sovereign-gold/5 -rotate-12 pointer-events-none" />
      </GlassPanel>
    </SovereignGlow>
  );
}
