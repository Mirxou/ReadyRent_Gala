"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Download, 
  Share2, 
  History, 
  Sparkles, 
  ShieldCheck, 
  Scale, 
  Globe,
  ChevronLeft,
  Smartphone,
  Flame,
  Zap,
  TrendingUp,
  Search
} from "lucide-react";
import { GlassPanel } from "@/shared/components/sovereign/glass-panel";
import { SovereignButton } from "@/shared/components/sovereign/sovereign-button";
import { SovereignGlow, SovereignSparkle } from "@/shared/components/sovereign/sovereign-sparkle";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * SocialCommander - High-Fidelity Asset Generator.
 * Moved to src/features/social/components/social-commander.tsx (Phase 11).
 * 
 * Features:
 * - Live Preview (Mobile/Desktop).
 * - Trend Ingestion Sidebar (Algeria Focus).
 * - Cinematic Frame Overlays.
 */

const TEMPLATES = [
  {
    id: "fb-post",
    platform: "Facebook",
    icon: Facebook,
    name: "مقال براهين الحقيقة",
    aspect: "aspect-[1.91/1]",
    frame: "/images/manifesto/frame1.png",
    defaultText: "العدالة الرقمية ليست مجرد تقنية، بل هي 'ميثاق سيادي' يضمن حقوق الجميع في الجزائر. ثق بنظام ReadyRent.",
    category: "Post"
  },
  {
    id: "ig-story",
    platform: "Instagram",
    icon: Instagram,
    name: "لمسة السوق الفاخرة",
    aspect: "aspect-[9/16]",
    frame: "/images/manifesto/frame2.png",
    defaultText: "رؤية 2026: نبض السوق العقاري الفاخر في الجزائر. كن جزءاً من النخبة السيادية.",
    category: "Story"
  },
  {
    id: "li-post",
    platform: "LinkedIn",
    icon: Linkedin,
    name: "إنجاز الثقة والسيادة",
    aspect: "aspect-square",
    frame: "/images/manifesto/frame4.png",
    defaultText: "يسرني أن أكون جزءاً من نظام ReadyRent السيادي. المعيار الذهبي الجديد للنزاهة العقارية.",
    category: "Milestone"
  }
];

const ALGERIA_TRENDS = [
  { topic: "تحدي القفطان العاصمي 2026", reach: "1.2M", engagement: "High" },
  { topic: "سوق السيارات الفاخرة في وهران", reach: "850K", engagement: "Rising" },
  { topic: "استبيان الثقة العقارية - قسنطينة", reach: "420K", engagement: "Steady" },
];

export function SocialCommander() {
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[1]);
  const [postText, setPostText] = useState(activeTemplate.defaultText);
  const [isPreviewMobile, setIsPreviewMobile] = useState(false);

  return (
    <div className="space-y-16" dir="rtl">
      
      {/* 1. Header: Command & Control */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
        <div className="space-y-4">
          <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em]">
            Sovereign Social Commander V.11
          </Badge>
          <h1 className="text-5xl font-black italic tracking-tighter">قائد التواصل <span className="text-sovereign-gold">الاجتماعي</span></h1>
          <p className="text-white/40 text-lg italic max-w-2xl">
            بوابة نشر "براهين الحقيقة". قم بتوليد أصول بصرية عالية الكثافة تتوافق مع هوية الجزائر السيادية.
          </p>
        </div>
        <div className="flex gap-4">
           <SovereignButton variant="secondary" size="lg" className="px-8 h-14 rounded-full">
              <History className="w-5 h-5 ml-3" /> أرشيف الحملات
           </SovereignButton>
           <SovereignButton variant="primary" size="lg" className="px-8 h-14 rounded-full shadow-2xl" withShimmer>
              توليد ذكي <Sparkles className="mr-3 w-5 h-5" />
           </SovereignButton>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        
        {/* Left Sidebar: Template & Trend Selection */}
        <div className="xl:col-span-4 space-y-10">
          
          {/* Trend Ingestion Panel (Phase 11 Elite Feature) */}
          <GlassPanel className="p-8 space-y-6" variant="obsidian">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sovereign-gold">
                   <Flame className="w-4 h-4 fill-current" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest">نبض السوق الجزائري</h4>
                </div>
                <Badge className="bg-red-500/10 text-red-500 border-0 text-[8px] animate-pulse">Trending Now</Badge>
             </div>
             <div className="space-y-4">
                {ALGERIA_TRENDS.map((trend, i) => (
                    <button key={i} className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-sovereign-gold/30 transition-all flex items-center justify-between group">
                        <div className="text-right">
                           <p className="text-xs font-bold text-white/80">{trend.topic}</p>
                           <p className="text-[9px] text-white/20 uppercase font-black">{trend.reach} Reach</p>
                        </div>
                        <Zap className="w-4 h-4 text-white/10 group-hover:text-sovereign-gold transition-colors" />
                    </button>
                ))}
             </div>
             <div className="pt-2">
                <button className="flex items-center gap-2 text-[9px] font-black text-sovereign-gold uppercase tracking-[0.2em] hover:underline">
                   <Search className="w-3 h-3" /> البحث عن ترندات مخصصة
                </button>
             </div>
          </GlassPanel>

          {/* Template Selection */}
          <GlassPanel className="p-8 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">القوالب السيادية</h3>
            <div className="flex flex-col gap-4">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => { setActiveTemplate(tmpl); setPostText(tmpl.defaultText); }}
                    className={cn(
                        "w-full p-5 rounded-3xl border-2 transition-all flex items-center justify-between group",
                        activeTemplate.id === tmpl.id 
                            ? "border-sovereign-gold bg-sovereign-gold/5" 
                            : "border-white/5 bg-white/[0.02] hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-2xl",
                          activeTemplate.id === tmpl.id ? "bg-sovereign-gold text-sovereign-black" : "bg-white/5 text-white/20"
                      )}>
                        <tmpl.icon className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <p className="font-black text-base">{tmpl.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-30">{tmpl.platform} / {tmpl.category}</p>
                      </div>
                    </div>
                    <ChevronLeft className={cn(
                        "w-5 h-5 transition-transform",
                        activeTemplate.id === tmpl.id ? "text-sovereign-gold -translate-x-2" : "text-white/10"
                    )} />
                  </button>
                ))}
            </div>
          </GlassPanel>
        </div>

        {/* Right Area: Interactive Editor & Preview */}
        <div className="xl:col-span-8 space-y-10">
            <GlassPanel className="p-10 space-y-10 relative overflow-hidden" gradientBorder>
                <div className="absolute top-0 left-0 p-10 opacity-5 pointer-events-none">
                    <Globe className="w-64 h-64 text-sovereign-gold" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                    {/* Editor Side */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-sovereign-gold px-2">نص العهد السيادي</label>
                            <textarea 
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                className="w-full h-64 bg-white/[0.03] border-2 border-white/5 rounded-[32px] p-8 text-lg font-medium italic focus:border-sovereign-gold outline-none transition-all resize-none shadow-inner"
                                placeholder="اكتب ميثاقك هنا..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SovereignButton variant="primary" size="lg" className="h-16 rounded-3xl shadow-gold-pulse" withShimmer>
                                توليد الأصل (8K) <Sparkles className="mr-3 w-5 h-5" />
                            </SovereignButton>
                            <SovereignButton variant="secondary" size="lg" className="h-16 rounded-3xl">
                                حفظ المسودة <Download className="mr-3 w-5 h-5" />
                            </SovereignButton>
                        </div>
                        
                        <div className="pt-4 flex items-center gap-4 text-[10px] font-black text-white/20 uppercase tracking-widest">
                            <TrendingUp className="w-4 h-4" />
                            AI Insight: This caption has 82% viral potential in Algiers.
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-4">
                            <div className="flex gap-2">
                                <button onClick={() => setIsPreviewMobile(false)} className={cn("p-2 rounded-lg transition-all", !isPreviewMobile ? "bg-sovereign-gold text-black" : "bg-white/5 text-white/20 hover:bg-white/10")}><Globe className="w-4 h-4" /></button>
                                <button onClick={() => setIsPreviewMobile(true)} className={cn("p-2 rounded-lg transition-all", isPreviewMobile ? "bg-sovereign-gold text-black" : "bg-white/5 text-white/20 hover:bg-white/10")}><Smartphone className="w-4 h-4" /></button>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] uppercase font-black">Live Render Stable</Badge>
                        </div>

                        <div className={cn("transition-all duration-700 mx-auto border-4 border-white/5 rounded-[48px] overflow-hidden shadow-2xl", isPreviewMobile ? "w-[280px]" : "w-full")}>
                            <SovereignGlow color="gold" intensity="high">
                                <div className={cn("relative w-full overflow-hidden flex flex-col justify-end p-8", activeTemplate.aspect)}>
                                    <Image src={activeTemplate.frame} alt="" fill className="object-cover opacity-90 scale-105 group-hover:scale-100 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-sovereign-obsidian via-sovereign-obsidian/20 to-transparent z-10" />
                                    
                                    <div className="relative z-20 space-y-4">
                                        <Badge className="bg-sovereign-gold text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                            {activeTemplate.platform}
                                        </Badge>
                                        <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight drop-shadow-2xl">
                                            {postText}
                                        </h3>
                                        <div className="flex items-center gap-4 pt-4 border-t border-white/20 opacity-40">
                                            <ShieldCheck className="w-3 h-3 text-sovereign-gold" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white">موثق سيادياً بجودة Standard</span>
                                        </div>
                                    </div>

                                    {/* Standard Header Logo */}
                                    <div className="absolute top-8 right-8 z-20 text-2xl font-black italic opacity-40 tracking-tighter">
                                        STAND<span className="text-sovereign-gold">ARD</span>
                                    </div>
                                </div>
                            </SovereignGlow>
                        </div>
                    </div>
                </div>
            </GlassPanel>
        </div>

      </div>

    </div>
  );
}
