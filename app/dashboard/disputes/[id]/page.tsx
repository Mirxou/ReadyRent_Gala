"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { disputesApi } from '@/lib/api';
import { 
  Scale, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  FileText, 
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Gavel,
  History,
  FileUp,
  Download,
  Info,
  Search
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';

export default function DisputeDetailPage() {
  const { id } = useParams();
  
  const { data: dispute, isLoading } = useQuery({
    queryKey: ['dispute', id],
    queryFn: () => disputesApi.getDisputes().then(res => res.data.find((d: any) => d.id === Number(id))),
  });

  if (isLoading || !dispute) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Scale className="w-12 h-12 animate-pulse text-sovereign-gold" />
        <span className="text-xs font-black uppercase tracking-widest opacity-40 italic">Consulting Judicial Scrolls...</span>
      </div>
    );
  }

  const timeline = [
    { date: '2026-03-28', event: 'تقديم طلب التحكيم (Claim Filed)', icon: FileText, complete: true, active: false },
    { date: '2026-03-29', event: 'تعيين المحكم السيادي (Arbitrator Assigned)', icon: Gavel, complete: true, active: false },
    { date: '2026-03-30', event: 'مراجعة الأدلة الرقمية (Evidence Review)', icon: Search, complete: false, active: true },
    { date: '--', event: 'الحكم النهائي (Final Verdict)', icon: ShieldCheck, complete: false, active: false }
  ];

  return (
    <div className="space-y-12 pb-40 text-right px-6" dir="rtl">
      
      {/* 🏛️ Header: The Judicial Vault */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-3">
          <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-sovereign-gold/5 italic">
             Sovereign Arbitration Vault V.2
          </Badge>
          <h1 className="text-5xl font-black italic tracking-tighter text-foreground">قضية العقد <span className="text-sovereign-gold">#ST-{dispute.booking_id}</span></h1>
          <p className="text-muted-foreground font-light text-xl italic opacity-80 pl-10 border-l-2 border-sovereign-gold/10">تحكيم سيادي تحت إشراف الـ Oracle لمراجعة الالتزامات الائتمانية.</p>
        </div>
        <SovereignButton variant="secondary" className="h-16 px-12 shadow-3xl shadow-sovereign-gold/10 rounded-2xl text-xl" withShimmer>
           تحميل التقرير الفني <Download className="w-5 h-5 ml-4" />
        </SovereignButton>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* RIGHT: The Judicial Process (Timeline - Span 4) */}
        <div className="lg:col-span-4 space-y-10">
           <GlassPanel className="p-10 space-y-12" gradientBorder>
              <h3 className="text-2xl font-black italic border-b border-white/5 pb-6">المسار القضائي (Protocol)</h3>
              
              <div className="relative space-y-12">
                 {/* The Timeline Line */}
                 <div className="absolute top-2 right-6 bottom-2 w-px bg-white/10" />
                 
                 {timeline.map((item, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.2 }}
                     className="relative flex items-start gap-8"
                   >
                     <div className={cn(
                       "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700",
                       item.complete ? "bg-emerald-500 text-black" : item.active ? "bg-sovereign-gold text-black shadow-3xl" : "bg-white/5 text-muted-foreground"
                     )}>
                        <item.icon className="w-6 h-6" />
                     </div>
                     <div className="text-right flex-1">
                        <p className="text-xs font-black text-muted-foreground opacity-40 uppercase tracking-widest">{item.date}</p>
                        <h4 className={cn(
                          "text-lg font-black italic",
                          item.active ? "text-sovereign-gold" : "text-foreground opacity-80"
                        )}>{item.event}</h4>
                     </div>
                   </motion.div>
                 ))}
              </div>
           </GlassPanel>

           <GlassPanel className="p-10 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20 space-y-6">
              <div className="flex items-center gap-4 text-red-500">
                  <AlertTriangle className="w-8 h-8" />
                  <h4 className="text-xl font-black italic">تحذير ائتماني</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic opacity-80">
                 سيتم تجميد مبلغ الضمان (Escrow) بالكامل حتى يتم إصدار الحكم النهائي من قبل المحكم المستقل.
              </p>
           </GlassPanel>
        </div>

        {/* LEFT: Evidence & Communication (Span 8) */}
        <div className="lg:col-span-8 space-y-10">
           
           {/* Evidence Vault */}
           <GlassPanel className="p-12 relative overflow-hidden h-[400px]" gradientBorder>
              <div className="flex items-center justify-between mb-12">
                  <h3 className="text-2xl font-black italic flex items-center gap-4">
                     <ShieldCheck className="w-8 h-8 text-sovereign-gold" /> خزانة الأدلة (Evidence Vault)
                  </h3>
                  <SovereignButton variant="secondary" className="h-12 px-8 rounded-xl border-white/10">
                     إضافة دليل <FileUp className="w-4 h-4 ml-3" />
                  </SovereignButton>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                 {[1, 2].map(idx => (
                    <div key={idx} className="aspect-square bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:border-sovereign-gold/40 transition-all">
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-sovereign-gold">
                            {idx === 1 ? <FileText /> : <Info />}
                        </div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Audit Record 0{idx}</p>
                    </div>
                 ))}
                 <div className="aspect-square border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-muted-foreground opacity-20">
                    <FileText className="w-10 h-10 mb-4" />
                    <p className="text-[8px] font-black uppercase tracking-widest">Awaiting Evidence</p>
                 </div>
              </div>
           </GlassPanel>

           {/* Arbitrator Chat Hub */}
           <SovereignGlow color="blue">
               <GlassPanel className="p-10 relative group" gradientBorder>
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-2xl font-black italic flex items-center gap-4">
                        <MessageSquare className="w-8 h-8 text-sovereign-blue" /> حوار التحكيم المباشر
                     </h3>
                     <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 flex gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> المحكم متوفر
                     </Badge>
                  </div>

                  <div className="h-80 bg-black/20 rounded-3xl p-8 mb-8 space-y-6 overflow-y-auto scrollbar-thin">
                      <div className="p-6 bg-white/5 rounded-2xl rounded-tr-none text-right max-w-[80%] mr-auto italic opacity-80 border-white/5 border">
                         <p className="text-xs font-black text-sovereign-blue uppercase mb-2">المحكم السيادي (Arbitrator)</p>
                         "يرجى توضيح حالة المنتج عند الاستلام وتزويدنا بصورة للغلاف (Eco-Wrap) إذا كان تالفاً."
                      </div>
                      <div className="p-6 bg-sovereign-blue/20 rounded-2xl rounded-tl-none text-right max-w-[80%] ml-auto italic border-sovereign-blue/20 border">
                         <p className="text-xs font-black text-muted-foreground uppercase mb-2">طلبك (Claimant)</p>
                         "تم إرفاق صورة الفستان فور الاستلام، هناك قطع طفيف في الجهة اليسرى."
                      </div>
                  </div>

                  <div className="relative">
                     <input placeholder="أدخل رسالتك الرسمية..." className="w-full h-16 bg-white/5 rounded-2xl px-8 focus:outline-none border border-white/5 focus:border-sovereign-blue/40 italic" />
                     <SovereignButton variant="primary" className="absolute left-2 top-1/2 -translate-y-1/2 h-12 px-10 rounded-xl">إرسال</SovereignButton>
                  </div>
               </GlassPanel>
           </SovereignGlow>

           {/* Legal Footer */}
           <div className="pt-10 flex items-center justify-center gap-10 opacity-20 grayscale scale-[0.8]">
              <History className="w-10 h-10" />
              <div className="h-px w-40 bg-white/20" />
              <ShieldCheck className="w-10 h-10" />
           </div>

        </div>

      </div>

    </div>
  );
}
