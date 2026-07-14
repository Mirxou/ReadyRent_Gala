"use client"
import { formatNumber } from '@/lib/utils';

import { useState, useEffect, useCallback } from 'react';
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
  Database,
  Send,
  Smartphone,
  ArrowLeftRight
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type TabKey = 'balance' | 'deposit' | 'transfer';
type DepositMode = 'deposit' | 'withdraw';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date?: string;
  created_at?: string;
  note?: string;
  hash?: string;
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'balance', label: 'الرصيد', icon: <Wallet className="w-4 h-4" /> },
  { key: 'deposit', label: 'الإيداع والسحب', icon: <ArrowLeftRight className="w-4 h-4" /> },
  { key: 'transfer', label: 'تحويل الأموال', icon: <Send className="w-4 h-4" /> },
];

export default function SovereignWallet() {
  const [balance, setBalance] = useState(0);
  const [escrowTotal, setEscrowTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('balance');
  const [depositMode, setDepositMode] = useState<DepositMode>('deposit');

  // Deposit/Withdraw form state
  const [dwAmount, setDwAmount] = useState('');
  const [dwMethod, setDwMethod] = useState<'baridimob' | 'bankcard'>('baridimob');
  const [dwRipNumber, setDwRipNumber] = useState('');
  const [dwCardNumber, setDwCardNumber] = useState('');
  const [dwExpiry, setDwExpiry] = useState('');
  const [dwCvv, setDwCvv] = useState('');
  const [dwLoading, setDwLoading] = useState(false);

  // Transfer form state
  const [trRecipient, setTrRecipient] = useState('');
  const [trAmount, setTrAmount] = useState('');
  const [trNote, setTrNote] = useState('');
  const [trLoading, setTrLoading] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch('/api/wallet')
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.balance !== undefined) {
          setBalance(d.data.balance);
        }
        if (Array.isArray(d?.data?.transactions)) {
          setTransactions(d.data.transactions);
        }
        // Calculate escrow total from transactions
        const escrow = (d?.data?.transactions || [])
          .filter((t: any) => t.type === 'ESCROW_HELD' || t.type === 'escrow_lock')
          .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        setEscrowTotal(escrow);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const switchToTab = useCallback((tab: TabKey, mode?: DepositMode) => {
    setActiveTab(tab);
    if (mode) setDepositMode(mode);
  }, []);

  const handleDwReset = useCallback(() => {
    setDwAmount('');
    setDwRipNumber('');
    setDwCardNumber('');
    setDwExpiry('');
    setDwCvv('');
    setDwMethod('baridimob');
  }, []);

  const handleDeposit = useCallback(async () => {
    const amount = parseFloat(dwAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    setDwLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, method: dwMethod }) });
      const json = await res.json();
      if (res.ok) {
        if (json?.data?.balance !== undefined) setBalance(json.data.balance);
        else setBalance(prev => prev + amount);
        toast.success('تم الإيداع بنجاح');
        handleDwReset();
      } else {
        toast.error(json?.error || 'فشل الإيداع');
      }
    } catch {
      toast.error('حدث خطأ أثناء الإيداع');
    } finally {
      setDwLoading(false);
    }
  }, [dwAmount, dwMethod, handleDwReset]);

  const handleWithdraw = useCallback(async () => {
    const amount = parseFloat(dwAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (amount > balance) {
      toast.error('المبلغ يتجاوز الرصيد المتاح');
      return;
    }
    setDwLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, method: dwMethod }) });
      const json = await res.json();
      if (res.ok) {
        if (json?.data?.balance !== undefined) setBalance(json.data.balance);
        else setBalance(prev => prev - amount);
        toast.success('تم السحب بنجاح');
        handleDwReset();
      } else {
        toast.error(json?.error || 'فشل السحب');
      }
    } catch {
      toast.error('حدث خطأ أثناء السحب');
    } finally {
      setDwLoading(false);
    }
  }, [dwAmount, balance, dwMethod, handleDwReset]);

  const handleTransfer = useCallback(async () => {
    const amount = parseFloat(trAmount);
    if (!trRecipient.trim()) {
      toast.error('يرجى إدخال رقم المستلم');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (amount > balance) {
      toast.error('المبلغ يتجاوز الرصيد المتاح');
      return;
    }
    setTrLoading(true);
    try {
      const res = await fetch('/api/wallet/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, recipient_phone: trRecipient }) });
      const json = await res.json();
      if (res.ok) {
        if (json?.data?.balance !== undefined) setBalance(json.data.balance);
        else setBalance(prev => prev - amount);
        toast.success('تم التحويل بنجاح');
        setTrRecipient('');
        setTrAmount('');
        setTrNote('');
      } else {
        toast.error(json?.error || 'فشل التحويل');
      }
    } catch {
      toast.error('حدث خطأ أثناء التحويل');
    } finally {
      setTrLoading(false);
    }
  }, [trRecipient, trAmount, trNote, balance]);

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
        
        {/* Header */}
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
                <SovereignButton variant="primary" size="lg" onClick={() => switchToTab('deposit', 'deposit')}>إيداع سيادي</SovereignButton>
                <SovereignButton variant="secondary" size="lg" onClick={() => switchToTab('deposit', 'withdraw')}>سحب الأصول</SovereignButton>
            </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/5 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'deposit') setDepositMode('deposit');
              }}
              className={`
                flex items-center gap-3 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all duration-500 border-b-2 -mb-px
                ${activeTab === tab.key 
                  ? 'border-sovereign-gold text-sovereign-gold' 
                  : 'border-transparent text-muted-foreground hover:text-white/60'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'balance' && (
            <motion.div
              key="balance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* THE SOVEREIGN CARD (3D Style) */}
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
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative group cursor-pointer"
                    >
                        <GlassPanel className="h-64 p-8 flex flex-col justify-between rounded-[2.5rem] bg-gradient-to-br from-sovereign-gold/20 via-sovereign-obsidian to-sovereign-obsidian border-sovereign-gold/30 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]" gradientBorder>
                            <div className="flex justify-between items-start">
                                <CreditCard className="w-10 h-10 text-sovereign-gold" />
                                <div className="text-right">
                                  <Fingerprint className="w-12 h-12 text-white/10 group-hover:text-sovereign-gold/40 transition-colors inline-block" />
                                  <div className="text-[6px] font-mono text-white/10 group-hover:text-sovereign-gold/20 leading-none mt-1">
                                    هاش_مصادقة: 8f2d...23e1
                                  </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="text-2xl font-black font-mono tracking-[0.4em] text-white/90">
                                    **** **** **** 2026
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[8px] font-black uppercase text-white/40 block mb-1">مواطن مميز</span>
                                        <span className="text-sm font-bold uppercase tracking-widest text-sovereign-gold">مستخدم_سيادي_01</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black uppercase text-white/40 block mb-1">الحالة</span>
                                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">سلامة نشطة</span>
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

                {/* THE VAULT LEDGER (Transactions) */}
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
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shrink-0 ${
                                            tx.type === 'INCOME' || tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 
                                            tx.type === 'EXPENDITURE' || tx.type === 'penalty' ? 'bg-red-500/10 text-red-500' : 'bg-sovereign-gold/10 text-sovereign-gold'
                                        }`}>
                                            {tx.type === 'INCOME' || tx.type === 'deposit' ? <ArrowDownLeft className="w-6 h-6" /> : 
                                             tx.type === 'EXPENDITURE' || tx.type === 'penalty' ? <ArrowUpRight className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex gap-3 items-center flex-wrap">
                                                <span className="font-black text-base md:text-lg tracking-tighter truncate">{tx.note || 'معاملة مالية'}</span>
                                                <Badge variant="outline" className="text-[9px] uppercase border-white/10 opacity-60 shrink-0">#{tx.id?.slice(0, 8) || tx.id}</Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-light">{new Date(tx.date || tx.created_at).toLocaleDateString('ar-DZ')}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-6 items-center shrink-0 mr-4">
                                        <div className="text-left">
                                            <span className={`text-lg md:text-xl font-black font-mono ${
                                                tx.type === 'INCOME' || tx.type === 'deposit' ? 'text-emerald-500' : 
                                                tx.type === 'EXPENDITURE' || tx.type === 'penalty' ? 'text-red-500' : 'text-sovereign-gold'
                                            }`}>
                                                {tx.type === 'INCOME' || tx.type === 'deposit' || tx.type === 'ESCROW_RELEASED' || tx.type === 'escrow_release' ? '+' : '-'}{formatNumber(tx.amount)} دج
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
                            <SovereignButton variant="secondary" onClick={() => toast.info('جارٍ تحميل الكشف...')}>تحميل كشف الحساب السيادي</SovereignButton>
                        </div>
                    </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'deposit' && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {/* Deposit/Withdraw Toggle */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDepositMode('deposit')}
                  className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all duration-500 ${
                    depositMode === 'deposit'
                      ? 'border-sovereign-gold bg-sovereign-gold/10 text-sovereign-gold'
                      : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  <ArrowDownLeft className="w-5 h-5" />
                  <span className="text-sm font-black uppercase tracking-widest">إيداع</span>
                </button>
                <button
                  onClick={() => setDepositMode('withdraw')}
                  className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all duration-500 ${
                    depositMode === 'withdraw'
                      ? 'border-sovereign-gold bg-sovereign-gold/10 text-sovereign-gold'
                      : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  <ArrowUpRight className="w-5 h-5" />
                  <span className="text-sm font-black uppercase tracking-widest">سحب</span>
                </button>
              </div>

              {/* Form */}
              <GlassPanel className="p-8 md:p-10 rounded-[2.5rem] space-y-8" variant="obsidian" gradientBorder>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-4">
                    {depositMode === 'deposit' ? (
                      <>
                        <ArrowDownLeft className="w-8 h-8 text-emerald-500" />
                        إيداع <span className="text-sovereign-gold">سيادي.</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-8 h-8 text-red-400" />
                        سحب <span className="text-sovereign-gold">الأصول.</span>
                      </>
                    )}
                  </h2>
                  {depositMode === 'withdraw' && (
                    <p className="text-sm text-muted-foreground font-light">
                      الرصيد المتاح: <span className="text-sovereign-gold font-black">{formatNumber(balance)} دج</span>
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">المبلغ (دج)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={dwAmount}
                    onChange={(e) => setDwAmount(e.target.value)}
                    className="h-16 text-2xl font-black font-mono bg-white/5 border-white/10 rounded-2xl text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10"
                    dir="ltr"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">طريقة الدفع</Label>
                  <Select value={dwMethod} onValueChange={(v) => setDwMethod(v as 'baridimob' | 'bankcard')}>
                    <SelectTrigger className="w-full h-14 bg-white/5 border-white/10 rounded-2xl text-base font-bold focus:ring-sovereign-gold/20 focus:border-sovereign-gold data-[placeholder]:text-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-sovereign-black border-sovereign-gold/20 rounded-2xl">
                      <SelectItem value="baridimob" className="text-base py-3 focus:bg-sovereign-gold/10 focus:text-sovereign-gold">
                        <span className="flex items-center gap-3">
                          <Smartphone className="w-4 h-4" />
                          البريدي موب (BaridiMob)
                        </span>
                      </SelectItem>
                      <SelectItem value="bankcard" className="text-base py-3 focus:bg-sovereign-gold/10 focus:text-sovereign-gold">
                        <span className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4" />
                          بطاقة بنكية
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Method-specific fields */}
                <AnimatePresence mode="wait">
                  {dwMethod === 'baridimob' ? (
                    <motion.div
                      key="baridimob"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">الرقم RIP</Label>
                        <Input
                          type="text"
                          placeholder="007999XXXXXXXXXX"
                          value={dwRipNumber}
                          onChange={(e) => setDwRipNumber(e.target.value)}
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10"
                          dir="ltr"
                        />
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-sovereign-gold/5 border border-sovereign-gold/10 rounded-2xl">
                        <Zap className="w-5 h-5 text-sovereign-gold shrink-0" />
                        <span className="text-sm text-sovereign-gold/80 font-light">سيتم إرسال رمز تأكيد إلى رقمك المسجل في البريدي موب</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bankcard"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">رقم البطاقة</Label>
                        <Input
                          type="text"
                          placeholder="**** **** **** ****"
                          value={dwCardNumber}
                          onChange={(e) => setDwCardNumber(e.target.value)}
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono text-center tracking-[0.3em] focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10"
                          dir="ltr"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">تاريخ الانتهاء</Label>
                          <Input
                            type="text"
                            placeholder="MM/YY"
                            value={dwExpiry}
                            onChange={(e) => setDwExpiry(e.target.value)}
                            className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono text-center focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10"
                            dir="ltr"
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">CVV</Label>
                          <Input
                            type="password"
                            placeholder="***"
                            value={dwCvv}
                            onChange={(e) => setDwCvv(e.target.value)}
                            className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-mono text-center focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10"
                            dir="ltr"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <SovereignButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={dwLoading}
                  onClick={depositMode === 'deposit' ? handleDeposit : handleWithdraw}
                >
                  {depositMode === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
                </SovereignButton>
              </GlassPanel>
            </motion.div>
          )}

          {activeTab === 'transfer' && (
            <motion.div
              key="transfer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <GlassPanel className="p-8 md:p-10 rounded-[2.5rem] space-y-8" variant="obsidian" gradientBorder>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-4">
                    <Send className="w-8 h-8 text-sovereign-gold" />
                    تحويل <span className="text-sovereign-gold">الأموال.</span>
                  </h2>
                  <p className="text-sm text-muted-foreground font-light">
                    الرصيد المتاح: <span className="text-sovereign-gold font-black">{formatNumber(balance)} دج</span>
                  </p>
                </div>

                {/* Recipient */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">رقم المستلم (هاتف أو بريد إلكتروني)</Label>
                  <Input
                    type="text"
                    placeholder="0555 XXX XXX أو email@example.com"
                    value={trRecipient}
                    onChange={(e) => setTrRecipient(e.target.value)}
                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-base text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10"
                    dir="ltr"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">المبلغ (دج)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={trAmount}
                    onChange={(e) => setTrAmount(e.target.value)}
                    className="h-16 text-2xl font-black font-mono bg-white/5 border-white/10 rounded-2xl text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10"
                    dir="ltr"
                  />
                </div>

                {/* Note */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-white/40 tracking-widest">ملاحظة (اختياري)</Label>
                  <Input
                    type="text"
                    placeholder="سبب التحويل..."
                    value={trNote}
                    onChange={(e) => setTrNote(e.target.value)}
                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-base text-right focus-visible:border-sovereign-gold focus-visible:ring-sovereign-gold/20 placeholder:text-white/10"
                  />
                </div>

                {/* Submit */}
                <SovereignButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={trLoading}
                  onClick={handleTransfer}
                >
                  إرسال الأموال
                </SovereignButton>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Section */}
        <footer className="pt-20 pb-10 border-t border-white/5 flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-4 opacity-20">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-white" />
                <Database className="w-4 h-4" />
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-white" />
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                    STANDARD.Rent | نظام الخزنة 2.0
                </p>
                <p className="text-[9px] text-white/10 uppercase tracking-widest">
                    سجلات ثابتة • سيولة سيادية • معايير مصرفية متميزة
                </p>
            </div>
        </footer>

      </div>
    </div>
  );
}