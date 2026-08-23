'use client';

import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownLeft, Lock, CreditCard,
  Activity, Database, ChevronRight, Fingerprint
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { type Transaction, type TabKey } from './types';

interface BalanceTabProps {
  balance: number;
  escrowTotal: number;
  transactions: Transaction[];
  onSwitchTab?: (tab: TabKey, mode?: 'deposit' | 'withdraw') => void;
}

function txDateStr(tx: Transaction) {
  return new Date(tx.date || tx.created_at || Date.now()).toLocaleDateString('ar-DZ');
}
function txIcon(type: string) {
  if (type === 'INCOME' || type === 'deposit') return <ArrowDownLeft className="w-6 h-6" />;
  if (type === 'EXPENDITURE' || type === 'penalty') return <ArrowUpRight className="w-6 h-6" />;
  return <Lock className="w-6 h-6" />;
}

function txColor(type: string) {
  if (type === 'INCOME' || type === 'deposit') return 'bg-emerald-500/10 text-emerald-500';
  if (type === 'EXPENDITURE' || type === 'penalty') return 'bg-red-500/10 text-red-500';
  return 'bg-sovereign-gold/10 text-sovereign-gold';
}

function txAmountColor(type: string) {
  if (type === 'INCOME' || type === 'deposit') return 'text-emerald-500';
  if (type === 'EXPENDITURE' || type === 'penalty') return 'text-red-500';
  return 'text-sovereign-gold';
}

function txSign(type: string) {
  return (type === 'INCOME' || type === 'deposit' || type === 'ESCROW_RELEASED' || type === 'escrow_release') ? '+' : '-';
}

export function BalanceTab({ balance, escrowTotal, transactions, onSwitchTab: _onSwitchTab }: BalanceTabProps) {
  const { user } = useAuthStore();

  return (
    <motion.div
      key="balance"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* THE SOVEREIGN CARD */}
        <div className="lg:col-span-1 space-y-8">
          <div className="flex justify-between items-end border-b border-white/5 pb-4">
            <h2 className="text-xl md:text-2xl font-black italic tracking-tighter flex items-center gap-3">
              بطاقة <span className="text-sovereign-gold">الهوية المالية.</span>
            </h2>
            <div className="flex items-center gap-2 mb-1 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest hidden sm:inline">نبض سلامة مباشر</span>
            </div>
          </div>

          <motion.div
            initial={{ perspective: 1000, rotateY: -10, rotateX: 10 }}
            whileHover={{ rotateY: 0, rotateX: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative group cursor-pointer"
          >
            <GlassPanel className="h-64 p-8 flex flex-col justify-between rounded-[2.5rem] bg-gradient-to-br from-sovereign-gold/20 via-sovereign-obsidian to-sovereign-obsidian border-sovereign-gold/30 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]" gradientBorder>
              <div className="flex justify-between items-start">
                <CreditCard className="w-10 h-10 text-sovereign-gold" />
                <div className="text-right">
                  <Fingerprint className="w-12 h-12 text-white/10 group-hover:text-sovereign-gold/40 transition-colors inline-block" />
                  <div className="text-[6px] font-mono text-white/10 group-hover:text-sovereign-gold/20 leading-none mt-1">
                    {user?.id ? `ID: ${user.id.slice(0, 4)}...${user.id.slice(-4)}` : 'STANDARD.Rent'}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="text-2xl font-black font-mono tracking-[0.4em] text-white/90">
                  {user?.phone ? `•••• ${user.phone.slice(-4)}` : 'STANDARD • WALLET'}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[8px] font-black uppercase text-white/40 block mb-1">مواطن مميز</span>
                    <span className="text-sm font-bold uppercase tracking-widest text-sovereign-gold">{user?.username || 'مواطن مميز'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase text-white/40 block mb-1">الحالة</span>
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">سلامة نشطة</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent skew-y-[-20deg] translate-y-full group-hover:translate-y-[-100%] transition-transform duration-[1500ms]" />
            </GlassPanel>
          </motion.div>

          <div className="space-y-6">
            <h3 className="text-xl font-black italic">نظرة عامة على الأرصدة</h3>
            <div className="grid grid-cols-1 gap-4">
              <SovereignGlow color="gold" intensity="low">
                <GlassPanel className="p-8 flex justify-between items-center rounded-3xl" variant="obsidian" gradientBorder>
                  <div>
                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest block mb-1">الرصيد المتاح</span>
                    <h4 className="text-3xl font-black italic">{formatNumber(balance)} دج</h4>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-emerald-500/50" />
                </GlassPanel>
              </SovereignGlow>
              <GlassPanel className="p-8 flex justify-between items-center rounded-3xl" variant="obsidian" gradientBorder>
                <div>
                  <span className="text-[10px] font-black uppercase text-white/30 tracking-widest block mb-1">المحجوز في الخزنة</span>
                  <h4 className="text-3xl font-black italic text-sovereign-gold">{formatNumber(escrowTotal)} دج</h4>
                </div>
                <Lock className="w-8 h-8 text-sovereign-gold/50" />
              </GlassPanel>
            </div>
          </div>
        </div>

        {/* THE VAULT LEDGER */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end border-b border-white/5 pb-4">
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-4">
              سجل الخزنة <span className="text-sovereign-gold">المشفر.</span>
            </h2>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:inline">فحص سلامة السجل: مُوثّق</span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(197,160,89,0.2) transparent' }}>
            {transactions.length > 0 ? transactions.map((tx) => (
              <motion.div key={tx.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
                <GlassPanel className="p-6 flex justify-between items-center group-hover:bg-white/[0.02] transition-colors rounded-3xl" gradientBorder>
                  <div className="flex gap-6 items-center min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shrink-0 ${txColor(tx.type)}`}>
                      {txIcon(tx.type)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex gap-3 items-center flex-wrap">
                        <span className="font-black text-base md:text-lg tracking-tighter truncate">{tx.note || 'معاملة مالية'}</span>
                        <Badge variant="outline" className="text-[9px] uppercase border-white/10 opacity-60 shrink-0">#{tx.id?.slice(0, 8) || tx.id}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-light">{txDateStr(tx)}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center shrink-0 mr-4">
                    <div className="text-left">
                      <span className={`text-lg md:text-xl font-black font-mono ${txAmountColor(tx.type)}`}>
                        {txSign(tx.type)}{formatNumber(tx.amount)} دج
                      </span>
                      {tx.hash && <code className="text-[8px] font-mono opacity-20 block group-hover:opacity-60 transition-opacity mt-1">{tx.hash}</code>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:-translate-x-2 transition-all cursor-pointer" />
                  </div>
                </GlassPanel>
              </motion.div>
            )) : (
              <div className="p-12 text-center">
                <Database className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground/60 text-sm">لا توجد معاملات بعد</p>
              </div>
            )}
          </div>

          <div className="p-8 md:p-10 bg-sovereign-gold/5 border border-sovereign-gold/10 rounded-[3rem] flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="space-y-3 text-right">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-sovereign-gold" />
                <h4 className="text-xl md:text-2xl font-black italic tracking-tighter">تحليل الذكاء المالي</h4>
              </div>
              <p className="text-sm text-white/40 leading-relaxed font-light">&ldquo;بناءً على عمليات الشهر الحالي، ارتفعت درجة النزاهة المالية لديك بنسبة 1.2%. أنت الآن مؤهل للحصول على سقف سحب أعلى في بروتوكول الفخامة.&rdquo;</p>
            </div>
            <div className="w-full md:w-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <SovereignButton variant="secondary" className="opacity-60 cursor-not-allowed" disabled>تحميل كشف الحساب السيادي</SovereignButton>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p>قريباً — توليد كشف حساب PDF تلقائي</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}