"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ShieldCheck, 
  Camera, 
  Layers, 
  Compass, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  BrainCircuit,
  Sparkles,
  Search,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { productsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 'identity', title: 'هوية الأصل', icon: Package, desc: 'تعريف الجوهر والمواصفات السيادية' },
  { id: 'visuals', title: 'البصمة البصرية', icon: Camera, desc: 'توثيق الحالة المادية بجودة عالية' },
  { id: 'valuation', title: 'بروتوكول القيمة', icon: Zap, desc: 'تحديد التسعير والضمانات الائتمانية' },
  { id: 'audit', title: 'التدقيق السيادي', icon: BrainCircuit, desc: 'فحص المعايير واختبار جودة النخبة' }
];

export default function StandardizeAssetPage() {
  const [step, setStep] = useState(0);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      startSovereignAudit();
    }
  };

  const startSovereignAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setIsComplete(true);
    }, 4000);
  };

  return (
    <div className="space-y-12 pb-40 max-w-6xl mx-auto text-right px-6" dir="rtl">
      
      {/* Header: The Ceremony */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
        <div className="space-y-3">
          <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-sovereign-gold/5">
             Asset Standardization Protocol V.2
          </Badge>
          <h1 className="text-5xl font-black italic tracking-tighter text-foreground">معيرة <span className="text-sovereign-gold">الأصل</span> السيادي<span className="text-sovereign-gold">.</span></h1>
          <p className="text-muted-foreground font-light text-xl italic opacity-80">نحول مقتنياتك إلى أصول "نخبوية" معتمدة في النظام البيئي.</p>
        </div>
        <SovereignButton variant="secondary" onClick={() => router.back()} className="h-14 px-8 rounded-2xl group border-white/5">
           <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-2" /> العودة للقيادة
        </SovereignButton>
      </header>

      {/* Progress Monolith */}
      <GlassPanel className="p-4 grid grid-cols-4 gap-2 bg-white/5 mb-12 rounded-3xl" gradientBorder>
        {STEPS.map((s, i) => (
           <div key={s.id} className={cn(
             "h-2 rounded-full transition-all duration-700",
             i <= step ? "bg-sovereign-gold shadow-[0_0_15px_rgba(184,159,103,0.5)]" : "bg-white/10"
           )} />
        ))}
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Step Guide (Left) */}
        <div className="lg:col-span-4 space-y-6">
           {STEPS.map((s, i) => (
             <GlassPanel key={s.id} className={cn(
               "p-6 flex items-center gap-6 transition-all duration-500 rounded-3xl",
               i === step ? "border-sovereign-gold bg-sovereign-gold/5 scale-[1.05]" : "opacity-30 grayscale blur-[1px]"
             )}>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  i === step ? "bg-sovereign-gold text-black" : "bg-white/5"
                )}>
                   <s.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                   <h4 className="font-black text-lg">{s.title}</h4>
                   <p className="text-[10px] text-muted-foreground opacity-60 font-black uppercase tracking-widest">{s.desc}</p>
                </div>
             </GlassPanel>
           ))}

           <GlassPanel className="p-8 bg-gradient-to-br from-sovereign-blue/20 to-black border-sovereign-blue/20">
              <ShieldCheck className="w-10 h-10 text-sovereign-blue mb-6" />
              <h4 className="text-lg font-black mb-4">ضمانة STANDARD</h4>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                 "بمجرد معيرة الأصل، يتم إدراجه في سجل الأصول السيادية مع تأمين كامل على القيمة وسجل صيانة رقمي مربوط بالـ Oracle."
              </p>
           </GlassPanel>
        </div>

        {/* Content Area (Right) */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
              {!isAuditing && !isComplete && (
                <motion.div 
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                   <GlassPanel className="p-12 h-full min-h-[600px] flex flex-col justify-between" gradientBorder>
                      <div className="space-y-12">
                         <h3 className="text-3xl font-black italic mb-10 flex items-center gap-4">
                            {STEPS[step].title} <span className="text-xs text-muted-foreground opacity-40 font-mono">0{step + 1} / 04</span>
                         </h3>

                         {step === 0 && (
                            <div className="space-y-8">
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">اسم الأصل السيادي (Name)</label>
                                  <Input placeholder="مثال: فستان قسنطيني ملكي - مجموعة 2026" className="h-16 rounded-2xl bg-white/5 border-white/5 text-xl font-black italic pr-6" />
                               </div>
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">التصنيف (Hierarchy)</label>
                                  <div className="flex flex-wrap gap-3">
                                     {['فساتين نادرة', 'سيارات فارهة', 'معدات إنتاج', 'أصول عقارية'].map(c => (
                                       <button key={c} className="px-6 py-3 rounded-xl border border-white/5 bg-white/5 hover:border-sovereign-gold/40 transition-all font-black text-xs uppercase italic">{c}</button>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         )}

                         {step === 1 && (
                            <div className="grid grid-cols-2 gap-6 h-64">
                               <div className="border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-sovereign-gold/40 transition-all group cursor-pointer">
                                  <Camera className="w-12 h-12 text-muted-foreground group-hover:text-sovereign-gold" />
                                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">صورة الصدر (Portrait)</p>
                               </div>
                               <div className="border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 group cursor-pointer">
                                  <Layers className="w-12 h-12 text-muted-foreground group-hover:text-sovereign-gold" />
                                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">التفاصيل (Macro View)</p>
                               </div>
                            </div>
                         )}

                         {step === 2 && (
                            <div className="space-y-12">
                               <div className="p-8 bg-sovereign-gold/5 rounded-3xl border border-sovereign-gold/10">
                                   <p className="text-sm font-black italic text-sovereign-gold mb-2">القيمة المقترحة من الـ Oracle</p>
                                   <p className="text-4xl font-black">15,000 - 18,000 <span className="text-sm">DA / Day</span></p>
                               </div>
                               <div className="grid grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">قيمة الحجز اليومي</label>
                                     <Input placeholder="0,00" className="h-16 rounded-2xl bg-white/5 border-white/5 text-2xl font-black" />
                                  </div>
                                  <div className="space-y-4">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">مبلغ الضمان الإجباري (Escrow)</label>
                                     <Input placeholder="0,00" value="45,000" disabled className="h-16 rounded-2xl bg-white/5 border-white/5 text-2xl font-black opacity-40" />
                                  </div>
                               </div>
                            </div>
                         )}
                      </div>

                      <div className="flex justify-between items-center mt-20">
                         <button onClick={() => setStep(prev => Math.max(0, prev - 1))} className="text-sm font-black text-muted-foreground hover:text-foreground">رجوع</button>
                         <SovereignButton variant="primary" size="xl" onClick={handleNext} className="h-16 px-16 rounded-2xl shadow-4xl shadow-sovereign-gold/10" withShimmer>
                            {step < 3 ? 'متابعة البروتوكول' : 'بدء التدقيق السيادي'} <Compass className="w-5 h-5 mr-4" />
                         </SovereignButton>
                      </div>
                   </GlassPanel>
                </motion.div>
              )}

              {isAuditing && (
                <motion.div 
                  key="auditing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-[600px] space-y-12 text-center"
                >
                   <SovereignSparkle active={true}>
                      <div className="w-32 h-32 rounded-full border-4 border-sovereign-gold border-t-transparent animate-spin flex items-center justify-center">
                         <BrainCircuit className="w-12 h-12 text-sovereign-gold" />
                      </div>
                   </SovereignSparkle>
                   <div className="space-y-3">
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">جاري التدقيق السيادي (Auditing...)</h3>
                      <p className="text-muted-foreground italic text-lg opacity-60">يتم الآن فحص البصمة البصرية، تقييم القيمة السوقية، واختبار "سلامة الثقة".</p>
                   </div>
                </motion.div>
              )}

              {isComplete && (
                <motion.div 
                  key="complete"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                   <GlassPanel className="p-20 text-center space-y-12 relative overflow-hidden h-[600px] flex flex-col justify-center items-center" gradientBorder>
                      <div className="absolute inset-0 bg-gradient-to-t from-sovereign-gold/5 via-transparent to-transparent pointer-events-none" />
                      
                      <SovereignGlow color="gold">
                         <div className="w-24 h-24 bg-sovereign-gold rounded-full flex items-center justify-center text-black shadow-4xl mb-8">
                            <CheckCircle2 className="w-12 h-12" />
                         </div>
                      </SovereignGlow>

                      <div className="space-y-4">
                         <h3 className="text-5xl font-black italic tracking-tighter text-foreground">تمت المعيرة بنجاح!</h3>
                         <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed italic">
                            أصلك الآن يحمل شارة **Sovereign Grade A**. تم إدراجه في سجل الأرشيف وهو جاهز لتوليد القيمة.
                         </p>
                      </div>

                      <div className="flex gap-6">
                         <SovereignButton variant="primary" size="xl" onClick={() => router.push('/dashboard/orders')} className="h-16 px-12 rounded-2xl">رؤية الأصل في السجل</SovereignButton>
                         <SovereignButton variant="secondary" size="xl" onClick={() => setIsComplete(false)} className="h-16 px-12 rounded-2xl">إضافة أصل آخر</SovereignButton>
                      </div>
                   </GlassPanel>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
