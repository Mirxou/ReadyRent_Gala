"use client";

import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Activity, 
  TrendingUp,
  Cpu,
  Fingerprint,
  Zap
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * EscrowPulse - The Sovereign Digital Vault Monitor.
 * Phase 13: Mastery Finalization.
 * 
 * Features:
 * - Real-time "Secured Liquidity" pulse.
 * - Global Escrow Statistics (Algerian Market).
 * - Forensic Vault status (PgBouncer/Encryption).
 */

export function EscrowPulse() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['escrow-metrics'],
    queryFn: () => paymentsApi.getEscrowMetrics().then(res => res.data),
    refetchInterval: 15000, // High-frequency pulse (15s)
  });

  const securedAmount = metrics?.metrics?.total_secured || 0;
  const activeCount = metrics?.metrics?.active_escrows || 0;
  const vaultStatus = metrics?.metrics?.vault_status || "ENCRYPTED_PGBOUNCER";

  return (
    <div className="w-full h-full" dir="rtl">
        <GlassPanel className="p-10 relative overflow-hidden h-full group border-white/5" variant="obsidian" gradientBorder>
            
            {/* 🛡️ Background Forensic Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--sovereign-gold)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full gap-12">
                
                {/* 1. Vault Header */}
                <div className="flex justify-between items-start">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-sovereign-gold/10 rounded-2xl border border-sovereign-gold/20 shadow-2xl">
                                <Lock className="w-6 h-6 text-sovereign-gold" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xl font-black italic tracking-tighter text-white/90 leading-none">الخزانة الرقمية</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Secured Algerian Dinar (DZD)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Badge className="bg-white/5 text-white/30 border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic">
                        Real-time Vault
                    </Badge>
                </div>

                {/* 2. Fiscal Pulse (The Number) */}
                <div className="space-y-2">
                    <div className="flex items-baseline gap-4">
                        <motion.span 
                            key={securedAmount}
                            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
                            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                            className="text-7xl font-black italic tracking-tighter text-white group-hover:text-sovereign-gold transition-colors duration-1000 font-mono"
                        >
                            {securedAmount.toLocaleString()}
                        </motion.span>
                        <span className="text-2xl font-black text-sovereign-gold italic uppercase tracking-widest">DZD</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/20">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">السيولة المضمونة حالياً في سوق الإيجار</span>
                    </div>
                </div>

                {/* 3. Forensic Multi-Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4 hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">دروع الأمان</span>
                            <ShieldCheck className="w-4 h-4 text-sovereign-gold" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-lg font-black italic text-white/90">256-Bit</div>
                            <div className="text-[8px] font-medium text-white/10 uppercase tracking-widest italic">{vaultStatus}</div>
                        </div>
                    </div>

                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4 hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">عمليات الضمان</span>
                            <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-lg font-black italic text-white/90">{activeCount}</div>
                            <div className="text-[8px] font-medium text-white/10 uppercase tracking-widest italic">ACTIVE CONTRATCS</div>
                        </div>
                    </div>
                </div>

                {/* 4. Integrity Footer */}
                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Fingerprint className="w-4 h-4 text-white/20" />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 italic">Forensic Integrity Guaranteed</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sovereign-gold/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-sovereign-gold/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-sovereign-gold/60" />
                    </div>
                </div>

            </div>
        </GlassPanel>
    </div>
  );
}
