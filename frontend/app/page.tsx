"use client";

import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { SovereignButton } from "@/shared/components/sovereign/sovereign-button";
import { GlassPanel } from "@/shared/components/sovereign/glass-panel";
import { IdentityShield } from "@/shared/components/sovereign/identity-shield";
import { ShieldCheck, LockKeyhole, FileSignature, ArrowRight, Sparkles, Activity, ShieldQuestion, Heart, Play, Download } from 'lucide-react';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { EcosystemPulse } from '@/features/analytics/components/ecosystem-pulse';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRef } from 'react';

const MANIFESTO_FRAMES = [
  { id: 1, src: "/images/manifesto/manifesto_frame_01_ar_realistic_luxury_gold_crest_close_up_1774864198802.png", title: "الخاتم السيادي", desc: "رمز الثقة المطلقة في كل معاملة" },
  { id: 2, src: "/images/manifesto/manifesto_frame_02_ar_realistic_luxury_sovereign_hall_sunset_1774864230612.png", title: "القاعة السيادية", desc: "حيث تتقاطع الفخامة مع العدالة الرقمية" },
  { id: 3, src: "/images/manifesto/manifesto_frame_03_ar_realistic_luxury_smart_contract_seal_1774864270057.png", title: "العقد الموثوق", desc: "ضمانات قانونية غير قابلة للنقض" },
  { id: 4, src: "/images/manifesto/manifesto_frame_04_ar_realistic_luxury_sovereignty_absolute_1774864298239.png", title: "السيادة المطلقة", desc: "نحن المعيار الذهبي الجديد" }
];

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const yMove = useTransform(scrollYProgress, [0, 0.2], [0, -100]);

  const frameTransforms = MANIFESTO_FRAMES.map((frame, index) => {
    const start = index / MANIFESTO_FRAMES.length;
    const end = (index + 1) / MANIFESTO_FRAMES.length;

    return {
      opacity: useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]),
      scale: useTransform(scrollYProgress, [start, end], [1, 1.2]),
    };
  });

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl" ref={containerRef}>

      {/* 🏛️ THE SOVEREIGN MANIFESTO (Pinnacle Hero) */}
      <section className="h-[250vh] w-full relative">
        
        {/* Sticky Cinematic Gallery */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
           <AnimatePresence>
              {MANIFESTO_FRAMES.map((frame, index) => {
                const transform = frameTransforms[index];

                return (
                  <motion.div
                    key={frame.id}
                    style={{ opacity: transform.opacity }}
                    className="absolute inset-0 z-0"
                  >
                     <motion.div style={{ scale: transform.scale }} className="w-full h-full relative">
                        <Image 
                          src={frame.src} 
                          alt={frame.title} 
                          fill 
                          className="object-cover opacity-60 grayscale-[0.2]"
                          priority
                        />
                        {/* Dramatic Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-sovereign-obsidian/80 via-transparent to-sovereign-obsidian" />
                     </motion.div>

                     {/* Cinematic Caption */}
                     <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        className="absolute bottom-40 right-20 z-10 max-w-2xl space-y-4"
                     >
                        <Badge className="bg-sovereign-gold text-sovereign-black px-4 py-1 rounded-full text-[10px] font-black uppercase">Manifesto Segment 0{frame.id}</Badge>
                        <h2 className="text-6xl font-black italic tracking-tighter">{frame.title}</h2>
                        <p className="text-2xl text-muted-foreground italic font-light">{frame.desc}</p>
                     </motion.div>
                  </motion.div>
                );
              })}
           </AnimatePresence>

           {/* Brand Centerpiece (Overlay) */}
           <motion.div 
              style={{ opacity, scale, y: yMove }}
              className="absolute inset-0 flex flex-col justify-center items-center z-20 text-center px-6"
           >
              <div className="absolute top-10 left-10 z-30 opacity-60 hover:opacity-100 transition-opacity">
                   <EcosystemPulse />
               </div>

              <SovereignSparkle active={true}>
                  <div className="mb-12 px-8 py-3 rounded-full border border-sovereign-gold/30 bg-sovereign-gold/5 text-sovereign-gold text-[10px] font-black tracking-[0.5em] uppercase italic backdrop-blur-md">
                     Sovereign Masterpiece V.2.0
                  </div>
              </SovereignSparkle>

              <SovereignGlow color="gold">
                 <h1 className="text-sovereign leading-tight">
                    STAND<span className="text-sovereign-gold">ARD.</span>
                 </h1>
              </SovereignGlow>
              
              <p className="mt-12 text-3xl font-light italic max-w-3xl opacity-80 leading-relaxed text-balance">
                 "ارتقِ إلى أبعد من المألوف. حيث يلتقي ميثاق الثقة المطلق مع رفاهية التملك السيادي."
              </p>

              <div className="flex flex-col md:flex-row gap-8 mt-16">
                 <Link href="/products">
                    <SovereignButton size="xl" variant="primary" className="h-20 px-12 text-2xl rounded-full" withShimmer>
                       تصفح المجموعة <ArrowRight className="mr-3 w-6 h-6" />
                    </SovereignButton>
                 </Link>
                 <Link href="/sovereign/presentation">
                    <SovereignButton size="xl" variant="secondary" className="h-20 px-12 text-xl rounded-full">
                       العرض التحكيمي <Play className="mr-3 w-5 h-5 fill-current" />
                    </SovereignButton>
                 </Link>
              </div>
           </motion.div>

           {/* Scroll Indicator */}
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] vertical-text">Scroll to Reveal</span>
              <div className="w-px h-20 bg-gradient-to-b from-sovereign-gold to-transparent" />
           </div>
        </div>
      </section>

      {/* 🛡️ SECTION: THE CONSTITUTION (Airy Edition) */}
      <section className="section-airy relative border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-32">
          
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
             <div className="space-y-4">
                <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-sovereign-gold/5 rounded-full">
                   Pinnacle Ethics V.9
                </Badge>
                <h2 className="text-7xl font-black italic tracking-tighter">دستور <span className="text-sovereign-gold">STANDARD.</span></h2>
             </div>
             <div className="max-w-md space-y-6">
                <p className="text-xl text-muted-foreground italic leading-relaxed">
                   "كل معاملة هي عهد سيادي محفوظ بالذكاء والتقدير. نحن لا ندير الأملاك، نحن نشفر الثقة."
                </p>
                <Link href="/reports/sovereign_intel_2026_ar.md">
                   <div className="flex items-center gap-3 text-sovereign-gold font-bold text-sm hover:underline cursor-pointer">
                      <Download className="w-4 h-4" /> تنزيل تقرير استخبارات السوق 2026
                   </div>
                </Link>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: 'سلسلة الحقيقة', 
                icon: ShieldCheck, 
                desc: 'نزاهة البيانات المطلقة باستخدام خوارزميات التشفير السيادي. بصمة رقمية لا تقبل التلاعب.',
                glow: 'gold'
              },
              { 
                title: 'آلة الضمان', 
                icon: LockKeyhole, 
                desc: 'تجميد القيمة المالية والزمنية فور التعاقد. أمان كامل للطرفين تحت إشراف المحكمة الكبرى.',
                glow: 'gold'
              },
              { 
                title: 'الهوية السيادية', 
                icon: FileSignature, 
                desc: 'نظام تحقق صارم يضمن دخول النخبة فقط. كلمتك هي العقد الموثق.',
                glow: 'gold'
              }
            ].map((pillar, i) => (
              <SovereignGlow key={i} color={pillar.glow as any}>
                  <GlassPanel className="p-16 h-full flex flex-col items-center text-center gap-8 group hover:scale-[1.02] transition-transform duration-700 rounded-[4rem]" gradientBorder>
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-foreground group-hover:text-sovereign-gold transition-colors shadow-2xl">
                       <pillar.icon className="w-12 h-12" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black italic">{pillar.title}</h3>
                        <p className="text-muted-foreground leading-relaxed text-md opacity-80">
                           {pillar.desc}
                        </p>
                    </div>
                  </GlassPanel>
              </SovereignGlow>
            ))}
          </div>
        </div>
      </section>

      {/* 🏆 THE GRAND CALL (Pinnacle CTA) */}
      <section className="py-60 px-6 text-center relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-sovereign-gold/10 rounded-full blur-[160px] opacity-20 animate-pulse" />
         
         <div className="max-w-5xl mx-auto space-y-16 relative z-10">
            <h2 className="text-[10rem] font-black italic tracking-tighter leading-none">كن سيد قرارك<span className="text-sovereign-gold">.</span></h2>
            <p className="text-3xl text-muted-foreground font-light max-w-3xl mx-auto italic opacity-80 leading-relaxed">
               "أنت لا تستأجر فقط؛ أنت تتبنى معياراً جديداً للسيادة العقارية. انضم إلى عالم STANDARD اليوم."
            </p>
            <div className="flex justify-center gap-10">
               <Link href="/register">
                  <SovereignButton size="xl" variant="primary" className="h-24 px-24 text-3xl shadow-4xl shadow-sovereign-gold/40 rounded-full" withShimmer>
                     ابدأ الرحلة السيادية
                  </SovereignButton>
               </Link>
            </div>
         </div>
      </section>

    </div>
  );
}
