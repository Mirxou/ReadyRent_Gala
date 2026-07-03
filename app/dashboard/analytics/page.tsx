"use client";

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, authApi } from '@/lib/api';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  Layers, 
  Compass, 
  Eye, 
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  PieChart,
  Fingerprint,
  Users,
  Activity,
  History
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignRadar } from '@/shared/components/sovereign/sovereign-radar';
import { EcosystemPulse } from '@/features/analytics/components/ecosystem-pulse';

export default function AnalyticsPage() {
  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.me().then(res => res.data),
  });

  const { data: behavior } = useQuery({
    queryKey: ['user-behavior'],
    queryFn: () => analyticsApi.getUserBehavior().then(res => res.data),
  });

  const { data: forecasts } = useQuery({
    queryKey: ['ecosystem-forecasts'],
    queryFn: () => analyticsApi.getDailyAnalytics().then(res => res.data),
  });

  return (
    <div className="space-y-12 pb-20 text-right px-6" dir="rtl">
      
      {/* 🚀 Header: The Command Center */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-3">
          <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-sovereign-gold/5">
             Ecosystem Tactical Intelligence Hub
          </Badge>
          <h1 className="text-6xl font-black tracking-tighter text-foreground italic flex items-center gap-4">
             ذكاء <span className="text-sovereign-gold">النظام</span> السيادي<span className="text-sovereign-gold">.</span>
          </h1>
          <p className="text-muted-foreground font-light text-xl italic opacity-80 pl-10 border-l-2 border-sovereign-gold/10">تحليل استباقي للسلوك والتوقعات المستقبلية للأدلة البيئية.</p>
        </div>
        <SovereignButton variant="primary" size="xl" className="h-20 px-16 shadow-3xl shadow-sovereign-gold/10 rounded-2xl text-xl" withShimmer>
           توليد تقرير استراتيجي <BrainCircuit className="w-6 h-6 ml-4" />
        </SovereignButton>
      </header>

      {/* ⚡ Live Ecosystem Pulse (Real-time Layer) */}
      <EcosystemPulse />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* RIGHT: Behavior Profile (Span 4) */}
        <div className="lg:col-span-4 space-y-10">
           <SovereignGlow color="gold">
                <GlassPanel className="p-10 relative overflow-hidden group h-full" gradientBorder>
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-14 h-14 bg-sovereign-gold/10 rounded-2xl flex items-center justify-center text-sovereign-gold">
                         <Fingerprint className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black italic">البصمة السلوكية</h3>
                         <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40">Biometric Trust Signature</p>
                      </div>
                   </div>

                   <div className="space-y-12 relative z-10">
                      <div className="space-y-5">
                         <div className="flex items-end justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">التصنيف المفضل (Top Category)</p>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] font-black uppercase">42% Preference</Badge>
                         </div>
                         <h4 className="text-2xl font-black italic underline decoration-sovereign-gold/30">قفطان جزائري عاصمي</h4>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} transition={{ duration: 2 }} className="h-full bg-sovereign-gold" />
                         </div>
                      </div>

                      <div className="space-y-6">
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">نمط الاستهلاك (Spending DNA)</p>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-sovereign-gold/5 transition-all">
                               <p className="text-[10px] text-muted-foreground mb-2 font-black">متوسط الصرف</p>
                               <p className="text-2xl font-black">12,500 <span className="text-xs font-normal">DA</span></p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-sovereign-blue/5 transition-all">
                               <p className="text-[10px] text-muted-foreground mb-2 font-black">تكرار الحجز</p>
                               <p className="text-2xl font-black">3.2 <span className="text-xs font-normal">Mo.</span></p>
                            </div>
                         </div>
                      </div>
                   </div>
                </GlassPanel>
           </SovereignGlow>

           {/* AI Recommendations Hub */}
           <GlassPanel className="p-10 bg-gradient-to-br from-sovereign-blue/20 to-transparent border-sovereign-blue/20 space-y-8" gradientBorder>
              <div className="flex items-center gap-4">
                  <Compass className="w-10 h-10 text-sovereign-blue" />
                  <h4 className="text-xl font-black italic">توقعات الـ Oracle</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic opacity-80">
                 بناءً على تحليلاتنا السلوكية، تتوقع الأنظمة ارتفاعاً في الطلب على "الفساتين القسنطينية" في شهر ماي. ننصح بالتخطيط المسبق لحجز مكانك السيادي.
              </p>
              <SovereignButton variant="secondary" className="w-full text-xs font-black uppercase tracking-widest h-14 rounded-2xl">رؤية التوقعات الموسمية</SovereignButton>
           </GlassPanel>
        </div>

        {/* LEFT: Tactical Engine (Span 8) */}
        <div className="lg:col-span-8 space-y-10">
           
           {/* Demand Radar Overlay */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <GlassPanel className="p-10 h-[500px]" gradientBorder>
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black flex items-center gap-4 italic">
                         <Activity className="w-6 h-6 text-sovereign-gold" /> رادار الطلب الاستراتيجي
                      </h3>
                      <Badge variant="outline" className="border-sovereign-gold/20 text-sovereign-gold uppercase text-[10px]">Real-time Clusters</Badge>
                   </div>
                   <SovereignRadar 
                     className="h-[350px] border-none" 
                     points={[
                       { x: 40, y: 30, label: 'Algiers Cluster' },
                       { x: 70, y: 50, label: 'Oran Pulse' },
                       { x: 30, y: 70, label: 'Constantine Node' }
                     ]}
                   />
                </GlassPanel>

                <GlassPanel className="p-10 h-[500px] flex flex-col" gradientBorder>
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black flex items-center gap-4 italic">
                         <TrendingUp className="w-6 h-6 text-emerald-500" /> مسار تصاعد الثقة
                      </h3>
                   </div>
                   
                   <div className="flex-1 relative flex items-end gap-3 pb-6">
                       {/* Trust Trajectory Bars */}
                       {[0.2, 0.5, 0.4, 0.8, 0.6, 1, 0.9, 1.2, 1.1, 1.4].map((v, i) => (
                           <motion.div 
                               key={i}
                               initial={{ height: 0 }}
                               animate={{ height: `${v * 50}%` }}
                               transition={{ delay: i * 0.1, duration: 1.5 }}
                               className="flex-1 bg-gradient-to-t from-emerald-500/20 to-emerald-500 rounded-lg group relative"
                           >
                               <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all">
                                   Trust Score: {Math.floor(v * 7)}
                               </div>
                           </motion.div>
                       ))}
                   </div>
                   <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                       <span>Month 01</span>
                       <span>Current Peak</span>
                   </div>
                </GlassPanel>
           </div>

           {/* Metrics Command Slab */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Ecosystem Liquidity', value: '42.5M DA', icon: Zap, color: 'text-sovereign-gold' },
                { label: 'Asset Cycle Health', value: '98.2%', icon: Target, color: 'text-emerald-500' },
                { label: 'Community Trust Vibe', value: 'Prime', icon: Users, color: 'text-sovereign-blue' }
              ].map((m, i) => (
                <GlassPanel key={i} className="p-8 border-white/5 group hover:border-sovereign-gold/20 transition-all">
                   <m.icon className={cn("w-8 h-8 mb-6 transition-transform group-hover:scale-110", m.color)} />
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 opacity-40">{m.label}</p>
                   <p className="text-2xl font-black italic">{m.value}</p>
                </GlassPanel>
              ))}
           </div>

           <GlassPanel className="p-10 bg-white/5 border-dashed border-white/10 text-center space-y-4">
              <History className="w-10 h-10 text-muted-foreground/10 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-40 italic">Historical Context Loaded</p>
           </GlassPanel>
        </div>

      </div>

    </div>
  );
}
