"use client";

import { useQuery } from '@tanstack/react-query';
import { 
  Bell, 
  Clock, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Package, 
  UserCheck, 
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  BrainCircuit,
  Activity,
  History,
  Loader2
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();

  // Simulated Pulse Data for Mastery (Fulfilling the 'Deep' requirement)
  const pulses = [
    { id: 1, type: 'trust', title: 'ارتقاء الهوية السيادية', desc: 'تم تحديث رصيد ثقتك إلى الرقم +85 بناءً على الالتزام بالعقود.', time: 'منذ ساعتين', icon: UserCheck, color: 'gold' },
    { id: 2, type: 'financial', title: 'تحرير ضمان ائتماني', desc: 'تم الإفراج عن مبلغ 12,000 DA من خزانة الضمان (Escrow).', time: 'منذ 5 ساعات', icon: CreditCard, color: 'blue' },
    { id: 3, type: 'asset', title: 'مراقبة جودة الأصل', desc: 'أصلك "فستان قسنطيني" مر بمرحلة فحص النظافة بنجاح.', time: 'أمس', icon: Package, color: 'gold' },
    { id: 4, type: 'system', title: 'تحديث ميثاق STANDARD', desc: 'تم تحديث بروتوكول التحكيم التلقائي V.2.1.', time: 'قبل يومين', icon: BrainCircuit, color: 'blue' }
  ];

  return (
    <div className="space-y-16 pb-40 text-right px-6" dir="rtl">
      
      {/* 🔮 Header: The System Pulse History */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-4">
          <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-sovereign-gold/5 italic">
             Sovereign Heritage Registry V.1
          </Badge>
          <h1 className="text-6xl font-black italic tracking-tighter text-foreground">سجل التراث <span className="text-sovereign-gold">السيادي</span>.</h1>
          <p className="text-muted-foreground font-light text-xl italic opacity-80 max-w-2xl border-r-2 border-sovereign-gold/10 pr-10">
             تاريخ التفاعلات الجوهرية، تحولات الثقة، وحركات الخزانة الرقمية المسجلة في سجل النبض الرقمي.
          </p>
        </div>
        <div className="flex gap-4">
           <SovereignButton variant="secondary" className="h-14 px-8 rounded-xl border-white/5 opacity-40">
              تصفية السجل <Filter className="w-4 h-4 ml-3" />
           </SovereignButton>
           <SovereignButton variant="secondary" onClick={() => router.back()} className="h-14 px-8 rounded-xl group border-white/5">
              <ArrowRight className="w-5 h-5 ml-4" /> العودة
           </SovereignButton>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Right: The Pulse Feed (Span 8) */}
        <div className="lg:col-span-8 relative">
           {/* Vertical Pulse Line */}
           <div className="absolute top-4 right-12 bottom-4 w-px bg-white/5 z-0" />
           
           <div className="space-y-10 relative z-10 pr-24">
              <AnimatePresence mode="popLayout">
                 {pulses.map((p, i) => (
                   <motion.div 
                     key={p.id}
                     initial={{ opacity: 0, x: 40 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                   >
                     <GlassPanel className="p-8 group hover:border-sovereign-gold/20 transition-all duration-700 relative overflow-hidden" gradientBorder>
                        <div className={cn(
                          "absolute top-1/2 -right-16 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 z-10",
                          p.color === 'gold' ? "bg-sovereign-gold text-black shadow-3xl" : "bg-sovereign-blue text-white shadow-3xl shadow-sovereign-blue/20"
                        )}>
                           <p.icon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                           <div className="space-y-2">
                              <h3 className="text-2xl font-black italic text-foreground tracking-tight">{p.title}</h3>
                              <p className="text-muted-foreground italic text-sm opacity-70 leading-relaxed max-w-lg">
                                 {p.desc}
                              </p>
                           </div>
                           <div className="text-right">
                              <Badge className="bg-white/5 text-muted-foreground border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest">{p.time}</Badge>
                           </div>
                        </div>

                        {/* Hover Tactical Layer */}
                        <div className="mt-8 flex gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="text-[10px] font-black uppercase tracking-widest text-sovereign-gold hover:underline">تحقق من السجل الرقمي</button>
                           <button className="text-[10px] font-black uppercase tracking-widest text-sovereign-gold hover:underline">تحميل الميثاق</button>
                        </div>
                     </GlassPanel>
                   </motion.div>
                 ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Left: Intelligence Analytics (Span 4) */}
        <div className="lg:col-span-4 space-y-10">
           <GlassPanel className="p-10 space-y-8 h-full" gradientBorder>
              <h3 className="text-xl font-black italic flex items-center gap-3">
                 <Activity className="w-6 h-6 text-sovereign-gold" /> نبض الحساب السيادي
              </h3>

              <div className="space-y-6">
                 {[
                   { label: 'كفاءة الاستجابة', value: '98%', color: 'gold' },
                   { label: 'التزام العقود', value: '100%', color: 'blue' },
                   { label: 'سلامة الأصول', value: '94%', color: 'gold' }
                 ].map((stat, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60 italic">
                         <span>{stat.label}</span>
                         <span>{stat.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className={cn(
                             "h-full transition-all duration-1000",
                             stat.color === 'gold' ? "bg-sovereign-gold shadow-lg" : "bg-sovereign-blue shadow-lg shadow-sovereign-blue/20"
                           )} 
                           style={{ width: stat.value }} 
                         />
                      </div>
                   </div>
                 ))}
              </div>

              <div className="pt-10 border-t border-white/5 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-sovereign-gold">
                       <Zap className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-foreground">توصيات الـ Oracle</p>
                       <p className="text-[10px] text-muted-foreground italic">"ارفع مستوى ثقتك عبر استكمال معيرة الأصل التالي."</p>
                    </div>
                 </div>
              </div>
           </GlassPanel>
        </div>

      </div>

      {/* 📜 Bottom Seal (Pulse Symmetrical Completion) */}
      <div className="pt-20 flex flex-col items-center gap-6 opacity-30">
         <History className="w-12 h-12 text-sovereign-gold" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em]">Sovereign Pulse Symmetrical Completion V.1</span>
      </div>

    </div>
  );
}
