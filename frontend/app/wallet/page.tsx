"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  Activity, 
  Zap, 
  Fingerprint,
  ChevronRight,
  Database
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignSeal } from '@/shared/components/sovereign/sovereign-seal';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENDITURE' | 'ESCROW_HELD' | 'ESCROW_RELEASED';
  amount: number;
  date: string;
  note: string;
  hash: string;
}

export default function SovereignWallet() {
  const [balance, setBalance] = useState(45250.00);
  const [escrowTotal, setEscrowTotal] = useState(12800.00);
  const [isLoading, setIsLoading] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { 
      id: 'TX-9021', 
      type: 'ESCROW_HELD', 
      amount: 1250.00, 
      date: new Date().toISOString(), 
      note: 'حجز فستان سهرة - مرجع #2041',
      hash: '0x8f2d...23e1'
    },
    { 
      id: 'TX-8942', 
      type: 'INCOME', 
      amount: 8500.00, 
      date: new Date(Date.now() - 86400000).toISOString(), 
      note: 'تسوية حجز معدات تصوير',
      hash: '0x4e5f...6g7h'
    },
    { 
      id: 'TX-8811', 
      type: 'EXPENDITURE', 
      amount: 2100.00, 
      date: new Date(Date.now() - 172800000).toISOString(), 
      note: 'رسوم فحص تقني - كاميرا سوني',
      hash: '0x9i0j...k1l2'
    }
  ]);

  useEffect(() => {
    // Simulate initial loading for "Masterpiece" feel
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-sovereign-obsidian">
        <div className="w-16 h-16 border-4 border-sovereign-gold/20 border-t-sovereign-gold rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-sovereign-obsidian text-sovereign-white font-arabic p-6 md:p-12 lg:p-20 relative overflow-hidden" dir="rtl">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-sovereign-gold/2 rounded-full blur-[140px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* 🏗️ Header / Global Identity */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/30 rounded-full py-1 px-4 text-[10px] uppercase font-black tracking-widest">
                        Sovereign Assets Hub
                    </Badge>
                    <div className="flex gap-2 items-center text-green-500 font-bold text-xs uppercase tracking-tighter">
                        <ShieldCheck className="w-4 h-4" /> Vault Secured
                    </div>
                </div>
                <h1 className="text-6xl font-black italic tracking-tighter">خزنة <span className="text-sovereign-gold">السيادة.</span></h1>
                <p className="text-muted-foreground text-xl font-light italic">"تحكم كامل في أصولك السائلة، محمية ببروتوكولات التجزئة السيادية."</p>
            </div>

            <div className="flex gap-4">
                <SovereignButton variant="primary" size="lg">إيداع سيادي</SovereignButton>
                <SovereignButton variant="secondary" size="lg">سحب الأصول</SovereignButton>
            </div>
        </header>

        {/* 📊 main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. THE SOVEREIGN CARD (3D Style) */}
            <div className="lg:col-span-1 space-y-8">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                      بطاقة <span className="text-sovereign-gold">الهوية المالية.</span>
                  </h2>
                  <div className="flex items-center gap-2 mb-1 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Live Integrity Heartbeat</span>
                  </div>
                </div>

                <motion.div 
                    initial={{ perspective: 1000, rotateY: -10, rotateX: 10 }}
                    whileHover={{ rotateY: 0, rotateX: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative group cursor-pointer"
                >
                    <GlassPanel className="h-64 p-8 flex flex-col justify-between rounded-[2.5rem] bg-gradient-to-br from-sovereign-gold/20 via-sovereign-obsidian to-sovereign-obsidian border-sovereign-gold/30 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]" gradientBorder>
                        <div className="flex justify-between items-start">
                            <CreditCard className="w-10 h-10 text-sovereign-gold" />
                            <div className="text-right">
                              <Fingerprint className="w-12 h-12 text-white/10 group-hover:text-sovereign-gold/40 transition-colors inline-block" />
                              <div className="text-[6px] font-mono text-white/10 group-hover:text-sovereign-gold/20 leading-none mt-1">
                                AUTH_SHA256: 8f2d...23e1
                              </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="text-2xl font-black font-mono tracking-[0.4em] text-white/90">
                                **** **** **** 2026
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-[8px] font-black uppercase text-white/40 block mb-1">Elite Citizen</span>
                                    <span className="text-sm font-bold uppercase tracking-widest text-sovereign-gold">SOVEREIGN_USER_01</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[8px] font-black uppercase text-white/40 block mb-1">Status</span>
                                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Active Integrity</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Shine */}
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
                                  <h4 className="text-3xl font-black italic">{balance.toLocaleString()} DA</h4>
                              </div>
                              <ArrowUpRight className="w-8 h-8 text-emerald-500/50" />
                          </GlassPanel>
                        </SovereignGlow>
                        <GlassPanel className="p-8 flex justify-between items-center rounded-3xl" variant="obsidian" gradientBorder>
                            <div>
                                <span className="text-[10px] font-black uppercase text-white/30 tracking-widest block mb-1">المحجوز في الخزنة (Escrow)</span>
                                <h4 className="text-3xl font-black italic text-sovereign-gold">{escrowTotal.toLocaleString()} DA</h4>
                            </div>
                            <Lock className="w-8 h-8 text-sovereign-gold/50" />
                        </GlassPanel>
                    </div>
                </div>
            </div>

            {/* 2. THE VAULT LEDGER (Transactions) */}
            <div className="lg:col-span-2 space-y-8">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-4">
                        سجل الخزنة <span className="text-sovereign-gold">المشفر.</span>
                    </h2>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">WORM Integrity Check: Verified</span>
                </div>

                <div className="space-y-4">
                    {transactions.map((tx) => (
                        <motion.div key={tx.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
                             <GlassPanel className="p-6 flex justify-between items-center group-hover:bg-white/[0.02] transition-colors rounded-3xl" gradientBorder>
                                <div className="flex gap-6 items-center">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 ${
                                        tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 
                                        tx.type === 'EXPENDITURE' ? 'bg-red-500/10 text-red-500' : 'bg-sovereign-gold/10 text-sovereign-gold'
                                    }`}>
                                        {tx.type === 'INCOME' ? <ArrowDownLeft className="w-6 h-6" /> : 
                                         tx.type === 'EXPENDITURE' ? <ArrowUpRight className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex gap-3 items-center">
                                            <span className="font-black text-lg tracking-tighter">{tx.note}</span>
                                            <Badge variant="outline" className="text-[9px] uppercase border-white/10 opacity-60">#{tx.id}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground font-light">{new Date(tx.date).toLocaleDateString('ar-DZ')} • {new Date(tx.date).toLocaleTimeString('ar-DZ')}</div>
                                    </div>
                                </div>

                                <div className="flex gap-6 items-center">
                                    <div className="text-left">
                                        <span className={`text-xl font-black font-mono ${
                                            tx.type === 'INCOME' ? 'text-emerald-500' : 
                                            tx.type === 'EXPENDITURE' ? 'text-red-500' : 'text-sovereign-gold'
                                        }`}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toLocaleString()} DA
                                        </span>
                                        <code className="text-[8px] font-mono opacity-20 block group-hover:opacity-60 transition-opacity mt-1">{tx.hash}</code>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all cursor-pointer" />
                                </div>
                             </GlassPanel>
                        </motion.div>
                    ))}
                </div>

                <div className="p-10 bg-sovereign-gold/5 border border-sovereign-gold/10 rounded-[3rem] flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="space-y-3 text-right md:text-right">
                        <div className="flex items-center gap-3">
                            <Activity className="w-6 h-6 text-sovereign-gold" />
                            <h4 className="text-2xl font-black italic tracking-tighter">تحليل الذكاء المالي</h4>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed font-light">"بناءً على عمليات الشهر الحالي، ارتفعت درجة النزاهة المالية لديك بنسبة 1.2%. أنت الآن مؤهل للحصول على سقف سحب أعلى في بروتوكول 'الفخامة'."</p>
                    </div>
                    <div className="w-full md:w-auto">
                        <SovereignButton variant="secondary">تحميل كشف الحساب السيادي</SovereignButton>
                    </div>
                </div>
            </div>

        </div>

        {/* 🎬 Footer Section */}
        <footer className="pt-20 pb-10 border-t border-white/5 flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-4 opacity-20">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-white" />
                <Database className="w-4 h-4" />
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-white" />
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                    READYRENT.GALA | VAULT SYSTEM 2.0
                </p>
                <p className="text-[9px] text-white/10 uppercase tracking-widest">
                    immutable records • sovereign liquidity • elite banking standards
                </p>
            </div>
        </footer>

      </div>
    </div>
  );
}
