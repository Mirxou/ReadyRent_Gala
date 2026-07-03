'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi, authApi, bookingsApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Lock, 
  History, 
  TrendingUp, 
  CreditCard,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignSparkle, SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { IdentityShield } from '@/shared/components/sovereign/identity-shield';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function WalletPage() {
  const { data: userProfile, isLoading: userLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.me().then(res => res.data),
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments-history'],
    queryFn: () => paymentsApi.getAll({ limit: 10 }).then(res => res.data),
  });

  const { data: activeBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['active-escrow'],
    queryFn: () => bookingsApi.getAll().then(res => res.data),
  });

  const escrowAmount = (activeBookings || []).reduce((acc: number, b: any) => {
    if (['confirmed', 'active', 'pending'].includes(b.status)) {
       return acc + (Number(b.deposit_amount) || 0);
    }
    return acc;
  }, 0);

  if (userLoading || paymentsLoading) {
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
                               {Number(userProfile?.wallet_balance || 0).toLocaleString()}
                            </SovereignSparkle>
                            <span className="text-2xl font-normal text-muted-foreground opacity-20 not-italic">DA</span>
                          </h2>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                           <SovereignButton variant="primary" size="lg" className="px-10 h-14 shadow-2xl shadow-sovereign-gold/10 rounded-2xl" withShimmer>
                              <ArrowUpRight className="w-5 h-5 ml-2" /> شحن الخزانة
                           </SovereignButton>
                           <SovereignButton variant="secondary" size="lg" className="px-10 h-14 rounded-2xl">
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
                               {escrowAmount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground/40">DA</span>
                            </h3>
                         </div>
                         <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-[200px] italic">
                            "أمان المجتمع محمي بضمانات فورية يتم فك حجزها آلياً عند انتهاء العقد."
                         </p>
                      </div>
                   </div>

                   {/* Decorative Element */}
                   <Wallet className="absolute -bottom-10 -right-10 w-48 h-48 text-sovereign-gold/5 -rotate-12 pointer-events-none" />
                </GlassPanel>
            </SovereignGlow>

            {/* Active Escrow Breakdown (The Shield of Protection) */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-3">
                     <Lock className="w-5 h-5 text-sovereign-gold" />
                     الضمانات النشطة (Sovereign Escrow)
                  </h3>
                  <Badge variant="outline" className="border-white/5 opacity-40">صندوق الأمان</Badge>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(activeBookings || []).filter((b: any) => ['confirmed', 'active', 'pending'].includes(b.status)).map((b: any) => (
                    <GlassPanel key={b.id} className="p-6 border-white/5 hover:border-sovereign-gold/20 transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase text-muted-foreground">Contract #ST-{b.id.toString().padStart(6, '0')}</p>
                             <h4 className="font-bold text-sm tracking-tight">{b.product_name}</h4>
                          </div>
                          <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-0 text-[10px] font-black">HELD</Badge>
                       </div>
                       <div className="flex justify-between items-end">
                          <div className="space-y-1">
                             <p className="text-[8px] text-muted-foreground uppercase">Escrow Value</p>
                             <p className="text-lg font-black">{Number(b.deposit_amount || 0).toLocaleString()} DA</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Release: {format(new Date(b.end_date), 'dd MMM')}</p>
                       </div>
                    </GlassPanel>
                  ))}
               </div>
            </div>

            {/* Immutable Transaction Ledger */}
            <div className="space-y-6 pt-8">
               <h3 className="text-xl font-black flex items-center gap-3">
                  <History className="w-5 h-5 text-sovereign-gold" />
                  مدونة المعاملات السيادية (Audit Ledger)
               </h3>
               
               <div className="space-y-3">
                  {payments?.results?.length > 0 ? (
                    payments.results.map((tx: any) => (
                      <motion.div key={tx.id} whileHover={{ x: -4 }}>
                        <GlassPanel className="p-5 flex items-center justify-between hover:border-white/10 transition-all border-white/5 group">
                           <div className="flex items-center gap-5">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                                tx.type === 'deposit' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" :
                                tx.type === 'escrow_lock' ? "bg-sovereign-gold/5 border-sovereign-gold/20 text-sovereign-gold" :
                                tx.type === 'penalty' ? "bg-red-500/5 border-red-500/20 text-red-500" :
                                "bg-white/5 border-white/10 text-muted-foreground"
                              )}>
                                 {tx.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : 
                                  tx.type === 'escrow_lock' ? <Lock className="w-4 h-4" /> :
                                  tx.type === 'penalty' ? <AlertTriangle className="w-5 h-5" /> :
                                  <ArrowDownLeft className="w-5 h-5" />}
                              </div>
                              <div className="space-y-0.5">
                                 <h4 className="font-bold text-sm text-foreground group-hover:text-sovereign-gold transition-colors">
                                    {tx.type === 'escrow_lock' ? 'تأمين ضمان سيادي' : 
                                     tx.type === 'escrow_release' ? 'فك رهن الضمان' : 
                                     tx.type === 'penalty' ? 'خصم جزائي (Resolution)' : (tx.description_ar || 'معاملة مالية')}
                                 </h4>
                                 <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-40">
                                    <span>#{tx.id.toString().padStart(8, '0')}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span>{tx.payment_method || 'Internal Vault'}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="text-left">
                              <p className={cn(
                                "text-xl font-black tracking-tighter",
                                tx.type === 'deposit' || tx.type === 'escrow_release' ? "text-emerald-500" : "text-foreground"
                              )}>
                                 {tx.type === 'deposit' || tx.type === 'escrow_release' ? '+' : '-'}{Number(tx.amount).toLocaleString()} <span className="text-xs font-normal opacity-40">DA</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground opacity-60">
                                {format(new Date(tx.created_at), 'dd MMMM yyyy', { locale: ar })}
                              </p>
                           </div>
                        </GlassPanel>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
                       <History className="w-12 h-12 text-muted-foreground/10" />
                       <p className="text-sm text-muted-foreground font-light uppercase tracking-widest opacity-40">No Audit Logs Found</p>
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
                    <IdentityShield status="verified" showLabel={false} trustScore={userProfile?.trust_score || 0} className="w-20 h-20 mb-6" />
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
      </div>
    </div>
  );
}
