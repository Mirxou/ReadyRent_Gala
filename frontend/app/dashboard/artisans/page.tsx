"use client";

import { useQuery } from '@tanstack/react-query';
import { innovationApi } from '@/lib/api';
import { 
  Users, 
  Scissors, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Star, 
  ChevronRight, 
  Camera, 
  Wand2,
  Gem,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { useRouter } from 'next/navigation';

export default function ArtisansPage() {
  const router = useRouter();

  const { data: artisans = [], isLoading } = useQuery({
    queryKey: ['artisans'],
    queryFn: () => innovationApi.getArtisans().then(res => res.data),
  });

  const categories = [
    { name: 'خياطة ملكية (Tailoring)', icon: Scissors, color: 'gold' },
    { name: 'تنظيف جاف (Elite Cleaning)', icon: Sparkles, color: 'blue' },
    { name: 'تصوير احترافي (Optics)', icon: Camera, color: 'gold' },
    { name: 'تعديل سيارات (Automotive Refinement)', icon: Wand2, color: 'blue' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-sovereign-gold" />
        <span className="text-xs font-black uppercase tracking-widest opacity-40 italic">Assembling Specialist Guilds...</span>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-40 text-right px-6" dir="rtl">
      
      {/* 🔮 Header: The Specialist Guilds */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-4">
          <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-sovereign-gold/5 italic">
             Sovereign Specialist Network V.3
          </Badge>
          <h1 className="text-6xl font-black italic tracking-tighter text-foreground">شبكة المبدعين <span className="text-sovereign-gold">المحترفين</span>.</h1>
          <p className="text-muted-foreground font-light text-xl italic opacity-80 max-w-2xl border-r-2 border-sovereign-gold/10 pr-10">
             نخبة الحرفيين الجزائريين المعتمدين لتقديم خدمات العناية، التعديل، والتوثيق لأصولك النخبوية.
          </p>
        </div>
        <SovereignButton variant="secondary" onClick={() => router.back()} className="h-16 px-12 rounded-2xl group border-white/5">
           <ArrowLeft className="w-5 h-5 ml-4 transition-transform group-hover:-translate-x-2" /> العودة للقيادة
        </SovereignButton>
      </header>

      {/* 🧭 Guild Filters (Elite UI) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {categories.map((c, i) => (
           <GlassPanel key={i} className="p-8 flex flex-col items-center text-center gap-6 group hover:scale-[1.05] transition-all cursor-pointer relative overflow-hidden" gradientBorder>
              <div className="absolute inset-0 bg-gradient-to-t from-sovereign-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-2xl",
                c.color === 'gold' ? "bg-sovereign-gold/10 text-sovereign-gold" : "bg-sovereign-blue/10 text-sovereign-blue"
              )}>
                 <c.icon className="w-8 h-8" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest leading-relaxed">{c.name}</h4>
           </GlassPanel>
         ))}
      </div>

      {/* 🏰 The Guild Hall (Specialist Registry) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-10">
        
        {/* Left: Artisan Spotlight (Registry - Span 8) */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {(artisans.length > 0 ? artisans : [1, 2, 3, 4, 5, 6]).map((item: any, i) => (
             <SovereignGlow key={i} color={i % 2 === 0 ? "gold" : "blue"}>
                <GlassPanel className="p-8 group relative overflow-hidden h-full flex flex-col justify-between" gradientBorder>
                   
                   {/* Background Token */}
                   <div className="absolute top-0 left-0 p-8 opacity-[0.03] rotate-[-12deg] pointer-events-none">
                      <Gem className="w-40 h-40" />
                   </div>

                   <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-start">
                         <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 overflow-hidden shadow-2xl transform group-hover:scale-110 transition-transform duration-700">
                            {/* Placeholder for real avatar data if exists, otherwise icon */}
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-30">
                               <Users className="w-10 h-10" />
                            </div>
                         </div>
                         <div className="flex flex-col items-end gap-2">
                             <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1 text-[9px] font-black uppercase italic tracking-widest shadow-sm">Certified</Badge>
                             <div className="flex items-center gap-1 text-sovereign-gold">
                                <Star className="w-3 h-3 fill-sovereign-gold" />
                                <Star className="w-3 h-3 fill-sovereign-gold" />
                                <Star className="w-3 h-3 fill-sovereign-gold" />
                                <Star className="w-3 h-3 fill-sovereign-gold" />
                                <Star className="w-3 h-3 fill-sovereign-gold opacity-30" />
                             </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <h3 className="text-2xl font-black italic text-foreground tracking-tight">{item.name || 'مبدع سيادي'}</h3>
                         <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground opacity-60">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.city || 'الجزائر العاصمة'}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> متاح الآن</span>
                         </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 italic text-xs leading-relaxed opacity-80 min-h-[64px]">
                         "متخصص في الخياطة القسنطينية والنقش اليدوي على الأقمشة الملكية مع ضمان الجودة السيادية."
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-center">
                            <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40 mb-1">عقود منجزة</p>
                            <p className="font-mono font-black text-foreground">124+</p>
                         </div>
                         <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-center">
                            <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40 mb-1">Trust Score</p>
                            <p className="font-mono font-black text-sovereign-gold">98%</p>
                         </div>
                      </div>
                   </div>

                   <div className="pt-8 relative z-10 mt-6">
                      <SovereignButton variant="primary" className="w-full h-14 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl" withShimmer>
                         طلب بروتوكول خدمة <ChevronRight className="w-4 h-4 mr-4" />
                      </SovereignButton>
                   </div>

                </GlassPanel>
             </SovereignGlow>
           ))}
        </div>

      </div>

      {/* 📜 Bottom Seal (System Integrity) */}
      <div className="pt-20 flex flex-col items-center gap-6 opacity-30">
         <div className="w-px h-24 bg-gradient-to-b from-sovereign-gold via-transparent to-transparent" />
         <ShieldCheck className="w-12 h-12 text-sovereign-gold" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em]">Elite Specialist Registry Protocol V.2</span>
      </div>

    </div>
  );
}
