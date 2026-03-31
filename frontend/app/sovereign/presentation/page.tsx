"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, ShieldCheck, Scale, Globe, Target, Fingerprint, Download } from "lucide-react";
import { GlassPanel } from "@/shared/components/sovereign/glass-panel";
import { SovereignButton } from "@/shared/components/sovereign/sovereign-button";
import { SovereignGlow } from "@/shared/components/sovereign/sovereign-sparkle";

const SLIDES = [
  {
    id: "cover",
    title: "ميثاق السيادة 2026",
    subtitle: "ReadyRent: التحول الرقمي للعدالة العقارية",
    icon: ShieldCheck,
    content: "نحن لا نصنع تطبيقاً للتأجير، نحن نصيغ 'ميثاقاً للثقة'. كل معاملة هي عهد سيادي محمي بقوة التكنولوجيا والعدالة.",
    footer: "عرض مخصص لهيئة المحكمة الكبرى",
    color: "gold"
  },
  {
    id: "truth-chain",
    title: "سلسلة الحقيقة (Truth Chain)",
    subtitle: "النزاهة التكرارية: من البيانات إلى القناعة",
    icon: Fingerprint,
    content: "استخدام خوارزمية BLAKE2b للتوقيع الرقمي لكل قطعة دليل. لا يمكن تعديل الماضي، ولا يمكن تزييف الحاضر. بصمة رقمية أبدية لكل عقد.",
    points: [
      "النزاهة المطلقة للبيانات",
      "شفافية تدقيقية 100%",
      "سجل غير قابل للتعديل"
    ],
    color: "blue"
  },
  {
    id: "escrow-machine",
    title: "آلة الضمان (Escrow Machine)",
    subtitle: "تجميد القيمة لفك النزاع",
    icon: Scale,
    content: "نظام تعاقدي ذكي يقوم بتجميد القيمة المالية والزمنية لحظة الحجز. يضمن حقوق الطرفين بقوة العقود الذكية المختومة سيادياً.",
    points: [
      "حماية ضد التضخم الإجرائي",
      "تسوية فورية عند صدور الحكم",
      "أمان مالي من الفئة البنكية"
    ],
    color: "gold"
  },
  {
    id: "market-intel",
    title: "استخبارات السوق السيادية",
    subtitle: "القرار المدعوم بالبيانات",
    icon: Globe,
    content: "نظام تحليل حي يرصد 2026 للتوجهات العقارية الفاخرة. نمط الاستثمار 'المدروس' بدلاً من الصفقات العشوائية.",
    points: [
      "رصد الأصول فائقة الفخامة",
      "تحليل السيولة الإقليمية",
      "تقارير ذكاء اصطناعي دورية"
    ],
    color: "blue"
  },
  {
    id: "closing",
    title: "مستقبل السيادة",
    subtitle: "نحو بيئة عقارية بلا نزاعات",
    icon: Target,
    content: "ReadyRent Gala هو المعيار الذهبي الجديد. نحن بصدد بناء نظام بيئي لا يقبل بأقل من 'السيادة المطلقة'.",
    footer: "شكراً لثقتكم في القيادة السيادية",
    color: "gold",
    isFinal: true
  }
];

export default function HighCourtPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = useCallback(() => {
    setCurrentSlide((prev) => (prev < SLIDES.length - 1 ? prev + 1 : prev));
  }, []);

  const prev = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") prev();  // Reverse for RTL
      if (e.key === "ArrowLeft") next();   // Reverse for RTL
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  const activeSlide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-sovereign-obsidian flex items-center justify-center p-4 md:p-10 font-arabic overflow-hidden" dir="rtl">
      
      {/* Presentation Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[120px] opacity-20" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[120px] opacity-20" />
      </div>

      <div className="w-full max-w-6xl aspect-[16/9] relative z-10">
        
        <GlassPanel 
           className="w-full h-full p-20 flex flex-col justify-between relative overflow-hidden"
           gradientBorder
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-12"
            >
              <SovereignGlow color={activeSlide.color as any}>
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-sovereign-gold shadow-2xl mb-4">
                  <activeSlide.icon className="w-12 h-12" />
                </div>
              </SovereignGlow>

              <div className="space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-7xl font-black tracking-tighter"
                >
                  {activeSlide.title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl text-sovereign-gold font-light italic"
                >
                  {activeSlide.subtitle}
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="max-w-3xl text-xl text-muted-foreground leading-relaxed italic opacity-90"
              >
                {activeSlide.content}
              </motion.div>

              {activeSlide.points && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-10">
                   {activeSlide.points.map((point, i) => (
                     <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + (i * 0.1) }}
                        className="px-6 py-4 rounded-full border border-white/5 bg-white/2 backdrop-blur-md text-sm font-bold"
                     >
                        {point}
                     </motion.div>
                   ))}
                </div>
              )}

              {activeSlide.isFinal && (
                 <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="pt-10"
                 >
                    <SovereignButton variant="primary" size="xl" href="/dashboard" withShimmer>
                        العودة للوحة التحكيم
                    </SovereignButton>
                 </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer & Controls */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/5">
             <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">
                {activeSlide.footer || `Sovereign Deck / Slide ${currentSlide + 1}`}
             </div>

             <div className="flex items-center gap-6">
                <button 
                  onClick={prev} 
                  disabled={currentSlide === 0}
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all"
                >
                   <ChevronRight className="w-6 h-6" />
                </button>
                <div className="flex gap-2">
                   {SLIDES.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-sovereign-gold w-6' : 'bg-white/10'}`} 
                      />
                   ))}
                </div>
                <button 
                  onClick={next} 
                  disabled={currentSlide === SLIDES.length - 1}
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all"
                >
                   <ChevronLeft className="w-6 h-6" />
                </button>
             </div>

             <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                <Download className="w-4 h-4" />
                تنزيل النسخة التنفيذية (PDF)
             </div>
          </div>
        </GlassPanel>

      </div>
    </div>
  );
}
