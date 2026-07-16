'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  History, 
  TrendingUp,
  Sparkles,
  RefreshCw,
  CreditCard,
  Loader2
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignSparkle, SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { IdentityShield } from '@/shared/components/sovereign/identity-shield';
import { Badge } from '@/components/ui/badge';
import { cn, formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { paymentsApi } from '@/lib/api';

async function fetchProfile() {
  const res = await fetch('/api/auth/profile');
  const json = await res.json();
  return json.data?.user || null;
}

async function fetchWallet() {
  const res = await fetch('/api/wallet');
  const json = await res.json();
  return json.data || null;
}

async function fetchBookings() {
  const res = await fetch('/api/bookings');
  const json = await res.json();
  return json.data || [];
}



export default function WalletPage() {
  const { data: userProfile, isLoading: userLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
  });

  const { data: activeBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['active-escrow'],
    queryFn: fetchBookings,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-history'],
    queryFn: async () => {
      const res = await paymentsApi.getAll();
      return res.data || [];
    },
  });

  const balance = walletData?.balance ?? userProfile?.wallet_balance ?? 0;
  const transactions = walletData?.transactions || [];

  const escrowAmount = (activeBookings || []).reduce((acc: number, b: any) => {
    if (['confirmed', 'active', 'pending'].includes(b.status)) {
       return acc + (Number(b.deposit_amount) || Number(b.total_price) || 0);
    }
    return acc;
  }, 0);

  const isLoading = userLoading || walletLoading || bookingsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="text-2xl font-black tracking-widest text-sovereign-gold animate-pulse">Sovereign Vault</div>
        <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="h-full w-1/2 bg-sovereign-gold"
          />
        </div>
      </div>
    );
  }

  const handleDeposit = () => {
    toast.info('ميزة قيد التطوير');
  };

  const handleWithdraw = () => {
    toast.info('ميزة قيد التطوير');
  };

  return (
    <div className="min-h-screen relative pb-20 bg-background text-right px-6" dir="rtl">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[140px] opacity-40" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-sovereign-blue/5 rounded-full blur-[140px] opacity-30" />
      </div>

      <div className="container mx-auto max-w-6xl py-12 relative z-10">
        
        <header className="mb-12 flex items-end justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
               Financial Sovereignty
            </Badge>
            <h1 className="text-5xl font-black tracking-tighter text-foreground">الرصيد السيادي<span className="text-sovereign-gold">.</span></h1>
            <p className="text-muted-foreground font-light italic">إدارة الأصول والضمانات البنكية للمجتمع النخبة.</p>
          </div>
          
          <SovereignButton variant="secondary" size="sm" className="hidden md:flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> تحديث السجل
          </SovereignButton>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* MAIN CARD: The Vault (Span 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Balance Overview */}
            <SovereignGlow color="gold">
                <GlassPanel className="p-10 relative overflow-hidden group h-full" gradientBorder>
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sovereign-gold via-sovereign-blue to-sovereign-gold opacity-30" />
                   
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
                           <SovereignButton variant="primary" size="lg" className="px-10 h-14 shadow-2xl shadow-sovereign-gold/10 rounded-2xl" withShimmer onClick={handleDeposit}>
                              <ArrowUpRight className="w-5 h-5 ml-2" /> شحن الخزانة
                           </SovereignButton>
                           <SovereignButton variant="secondary" size="lg" className="px-10 h-14 rounded-2xl" onClick={handleWithdraw}>
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

                   {/* Decorative Element */}
                   <Wallet className="absolute -bottom-10 -right-10 w-48 h-48 text-sovereign-gold/5 -rotate-12 pointer-events-none" />
                </GlassPanel>
            </SovereignGlow>

            {/* Active Escrow Breakdown */}
            {activeBookings && activeBookings.filter((b: any) => ['confirmed', 'active', 'pending'].includes(b.status)).length > 0 && (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-3">
                     <Lock className="w-5 h-5 text-sovereign-gold" />
                     الضمانات النشطة (Sovereign Escrow)
                  </h3>
                  <Badge variant="outline" className="border-white/5 opacity-40">صندوق الأمان</Badge>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBookings.filter((b: any) => ['confirmed', 'active', 'pending'].includes(b.status)).map((b: any) => (
                    <GlassPanel key={b.id} className="p-6 border-white/5 hover:border-sovereign-gold/20 transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase text-muted-foreground">Contract #{b.id}</p>
                             <h4 className="font-bold text-sm tracking-tight">{b.product_name}</h4>
                          </div>
                          <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-0 text-[10px] font-black">HELD</Badge>
                       </div>
                       <div className="flex justify-between items-end">
                          <div className="space-y-1">
                             <p className="text-[8px] text-muted-foreground uppercase">Escrow Value</p>
                             <p className="text-lg font-black">{formatNumber(b.deposit_amount || b.total_price || 0)} DA</p>
                          </div>
                          {b.end_date && (
                            <p className="text-[10px] text-muted-foreground">Release: {format(new Date(b.end_date), 'dd MMM')}</p>
                          )}
                       </div>
                    </GlassPanel>
                  ))}
               </div>
            </div>
            )}

            {/* Immutable Transaction Ledger */}
            <div className="space-y-6 pt-8">
               <h3 className="text-xl font-black flex items-center gap-3">
                  <History className="w-5 h-5 text-sovereign-gold" />
                  مدونة المعاملات السيادية (Audit Ledger)
               </h3>
               
               <div className="space-y-3">
                  {transactions.length > 0 ? (
                    transactions.map((tx: any) => (
                      <motion.div key={tx.id} whileHover={{ x: -4 }}>
                        <GlassPanel className="p-5 flex items-center justify-between hover:border-white/10 transition-all border-white/5 group">
                           <div className="flex items-center gap-5">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                                tx.type === 'INCOME' || tx.type === 'deposit' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" :
                                tx.type === 'ESCROW_HELD' || tx.type === 'escrow_lock' ? "bg-sovereign-gold/5 border-sovereign-gold/20 text-sovereign-gold" :
                                tx.type === 'penalty' || tx.type === 'EXPENDITURE' ? "bg-red-500/5 border-red-500/20 text-red-500" :
                                "bg-white/5 border-white/10 text-muted-foreground"
                              )}>
                                 {tx.type === 'INCOME' || tx.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : 
                                  tx.type === 'ESCROW_HELD' || tx.type === 'escrow_lock' ? <Lock className="w-4 h-4" /> :
                                  <ArrowDownLeft className="w-5 h-5" />}
                              </div>
                              <div className="space-y-0.5">
                                 <h4 className="font-bold text-sm text-foreground group-hover:text-sovereign-gold transition-colors">
                                    {tx.note || (tx.type === 'escrow_lock' ? 'تأمين ضمان سيادي' : 
                                     tx.type === 'escrow_release' ? 'فك رهن الضمان' : 'معاملة مالية')}
                                 </h4>
                                 <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-40">
                                    <span>#{tx.id}</span>
                                    {tx.hash && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                        <span>{tx.hash}</span>
                                      </>
                                    )}
                                 </div>
                              </div>
                           </div>
                           
                           <div className="text-left">
                              <p className={cn(
                                "text-xl font-black tracking-tighter",
                                tx.type === 'INCOME' || tx.type === 'deposit' || tx.type === 'escrow_release' ? "text-emerald-500" : "text-foreground"
                              )}>
                                 {tx.type === 'INCOME' || tx.type === 'deposit' || tx.type === 'escrow_release' ? '+' : '-'}{formatNumber(tx.amount)} <span className="text-xs font-normal opacity-40">DA</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground opacity-60">
                                {format(new Date(tx.date), 'dd MMMM yyyy', { locale: ar })}
                              </p>
                           </div>
                        </GlassPanel>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
                       <History className="w-12 h-12 text-muted-foreground/10" />
                       <p className="text-sm text-muted-foreground font-light uppercase tracking-widest opacity-40">لا توجد معاملات بعد</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* SIDEBAR: Trust Metrics (Span 4) */}
          <div className="lg:col-span-4 space-y-8">
             
             {/* Trust Reward Card */}
             <GlassPanel className="p-8 border-l-4 border-l-emerald-500 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="flex flex-col items-center text-center relative z-10">
                    <IdentityShield status={userProfile?.is_verified ? "verified" : "unverified"} showLabel={false} trustScore={userProfile?.trust_score || 0} className="w-20 h-20 mb-6" />
                    <h4 className="text-lg font-black mb-2 italic">امتيازات النخبة السيادية</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-8 opacity-60">
                       بناءً على سجل معاملتكم الرقمية المعاصرة، يتم تطبيق بروتوكول الخصم الآلي.
                    </p>
                    
                    <div className="w-full p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 group hover:bg-emerald-500/10 transition-all">
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-2">Active Sovereign Discount</p>
                       <div className="flex items-baseline justify-center gap-2">
                           <p className="text-5xl font-black text-emerald-500 tracking-tighter">-25%</p>
                           <span className="text-[10px] font-bold text-emerald-600/60 uppercase">Deduction</span>
                       </div>
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
                         <span className="text-xl font-black">42,500 <span className="text-xs">DA</span></span>
                      </div>
                      <div className="w-1/2 h-8 flex items-end gap-1">
                         {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1].map((val, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ height: 0 }}
                             animate={{ height: `${val * 100}%` }}
                             className="flex-1 bg-sovereign-gold/20 rounded-t-sm" 
                           />
                         ))}
                      </div>
                   </div>

                   <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                         <span className="text-[10px] text-muted-foreground font-bold">الضمانات المستردة</span>
                         <span className="text-xl font-black">15,000 <span className="text-xs">DA</span></span>
                      </div>
                      <div className="w-1/2 h-8 flex items-end gap-1">
                         {[0.3, 0.5, 0.8, 0.4, 0.9, 0.6, 0.7].map((val, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ height: 0 }}
                             animate={{ height: `${val * 100}%` }}
                             className="flex-1 bg-emerald-500/20 rounded-t-sm" 
                           />
                         ))}
                      </div>
                   </div>
                </div>

                <SovereignButton variant="secondary" size="sm" className="w-full mt-10">
                   تقرير مالي مفصل
                </SovereignButton>
             </GlassPanel>

             {/* Sovereign Shield */}
             <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-sovereign-blue to-black border border-white/5 relative overflow-hidden shadow-2xl">
                <Sparkles className="absolute top-4 left-4 w-4 h-4 text-sovereign-gold/40" />
                <Lock className="w-10 h-10 text-sovereign-gold mb-6" />
                <h4 className="text-white font-bold mb-2">تأمين Standard المطلق</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">
                   جميع معاملاتك المالية محمية بنظام تشفير سيادي وفريق أمني يعمل على مدار الساعة.
                </p>
             </div>
          </div>
        </div>

        {/* Payments History Section */}
        <div className="lg:col-span-12 space-y-6 pt-4">
          <h3 className="text-xl font-black flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-sovereign-gold" />
            سجل المدفوعات (Payments History)
          </h3>

          {paymentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-sovereign-gold animate-spin" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payments.map((p: any) => (
                <GlassPanel key={p.id} className="p-5 border-white/5 hover:border-sovereign-gold/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {format(new Date(p.created_at), 'dd MMMM yyyy', { locale: ar })}
                    </p>
                    <Badge className={cn(
                      'border-0 text-[9px] font-black px-2 py-0.5',
                      p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      p.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      p.status === 'refunded' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-white/5 text-muted-foreground'
                    )}>
                      {p.status === 'completed' ? 'مكتمل' :
                       p.status === 'failed' ? 'فشل' :
                       p.status === 'refunded' ? 'مسترجع' :
                       p.status === 'pending' ? 'معلّق' : p.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xl font-black tracking-tighter text-foreground">
                        {formatNumber(p.amount)} <span className="text-xs font-normal opacity-40">DA</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                        {p.method || '—'}
                      </p>
                    </div>
                    {p.escrow_status && (
                      <Badge variant="outline" className="border-sovereign-gold/20 text-sovereign-gold text-[9px] font-black">
                        {p.escrow_status === 'held' ? 'محفوظ' :
                         p.escrow_status === 'released' ? 'مفكوك' : p.escrow_status}
                      </Badge>
                    )}
                  </div>
                </GlassPanel>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
              <CreditCard className="w-12 h-12 text-muted-foreground/10" />
              <p className="text-sm text-muted-foreground font-light uppercase tracking-widest opacity-40">لا توجد مدفوعات بعد</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}