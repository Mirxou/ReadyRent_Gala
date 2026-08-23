"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Wallet, ArrowLeftRight, Send, ShieldCheck, Database } from 'lucide-react';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { type TabKey, type Transaction } from './_components/types';
import { BalanceTab } from './_components/balance-tab';
import { DepositTab } from './_components/deposit-tab';
import { TransferTab } from './_components/transfer-tab';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'balance', label: 'الرصيد', icon: Wallet },
  { key: 'deposit', label: 'الإيداع والسحب', icon: ArrowLeftRight },
  { key: 'transfer', label: 'تحويل الأموال', icon: Send },
];

export default function SovereignWallet() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [escrowTotal, setEscrowTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('balance');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/wallet');
    }
  }, [isAuthenticated, router]);

  const updateBalance = useCallback((updater: (prev: number) => number) => {
    setBalance(updater);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/wallet', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.balance !== undefined) setBalance(d.data.balance);
        if (Array.isArray(d?.data?.transactions)) setTransactions(d.data.transactions);
        const escrow = (d?.data?.transactions || [])
          .filter((t: Record<string, unknown>) => (t.type as string) === 'ESCROW_HELD' || t.type === 'escrow_lock')
          .reduce((sum: number, t: Record<string, unknown>) => sum + (Number(t.amount as number) || 0), 0);
        setEscrowTotal(escrow);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const switchToTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-sovereign-obsidian">
      <div className="w-16 h-16 border-4 border-sovereign-gold/20 border-t-sovereign-gold rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-sovereign-obsidian text-sovereign-white font-arabic p-6 md:p-12 lg:p-20 relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-sovereign-gold/2 rounded-full blur-[140px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/30 rounded-full py-1 px-4 text-[10px] uppercase font-black tracking-widest">
                مركز الأصول السيادي
              </Badge>
              <div className="flex gap-2 items-center text-green-500 font-bold text-xs uppercase tracking-tighter">
                <ShieldCheck className="w-4 h-4" /> الخزنة مؤمّنة
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter">خزنة <span className="text-sovereign-gold">السيادة.</span></h1>
            <p className="text-muted-foreground text-lg md:text-xl font-light italic">&ldquo;تحكم كامل في أصولك السائلة، محمية ببروتوكولات التجزئة السيادية.&rdquo;</p>
          </div>
          <div className="flex gap-4">
            <SovereignButton variant="primary" size="lg" onClick={() => switchToTab('deposit')}>إيداع سيادي</SovereignButton>
            <SovereignButton variant="secondary" size="lg" onClick={() => setActiveTab('deposit')}>سحب الأصول</SovereignButton>
          </div>
        </header>

        <div className="flex gap-2 border-b border-white/5 pb-0">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all duration-500 border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-sovereign-gold text-sovereign-gold'
                    : 'border-transparent text-muted-foreground hover:text-white/60'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'balance' && (
            <BalanceTab balance={balance} escrowTotal={escrowTotal} transactions={transactions} onSwitchTab={switchToTab} />
          )}
          {activeTab === 'deposit' && (
            <DepositTab balance={balance} onBalanceUpdate={updateBalance} />
          )}
          {activeTab === 'transfer' && (
            <TransferTab balance={balance} onBalanceUpdate={updateBalance} />
          )}
        </AnimatePresence>

        <footer className="pt-20 pb-10 border-t border-white/5 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-4 opacity-20">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-white" />
            <Database className="w-4 h-4" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-white" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">STANDARD.Rent | نظام الخزنة 2.0</p>
            <p className="text-[9px] text-white/10 uppercase tracking-widest">سجلات ثابتة • سيولة سيادية • معايير مصرفية متميزة</p>
          </div>
        </footer>
      </div>
    </div>
  );
}