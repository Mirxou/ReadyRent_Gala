"use client";

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  ChevronRight, 
  ArrowRight,
  Gem,
  History,
  Activity,
  Zap,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const router = useRouter();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => productsApi.getWishlist().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-sovereign-gold" />
        <span className="text-xs font-black uppercase tracking-widest opacity-40 italic">Retrieving Asset Registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-40 text-right px-6" dir="rtl">
      
      {/* 🔮 Header: The Elite Registry */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-4">
          <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-sovereign-gold/5 italic">
             Sovereign Heritage Registry V.1
          </Badge>
          <h1 className="text-6xl font-black italic tracking-tighter text-foreground">سجل أمنيات <span className="text-sovereign-gold">النخبة</span>.</h1>
          <p className="text-muted-foreground font-light text-xl italic opacity-80 max-w-2xl border-r-2 border-sovereign-gold/10 pr-10">
             الأصول المختارة بعناية لتكون جزءاً من تاريخك القادم. تتبع التوافر، الجودة، ونبض السوق لكل قطعة.
          </p>
        </div>
        <SovereignButton variant="secondary" onClick={() => router.back()} className="h-16 px-12 rounded-2xl group border-white/5">
           <ArrowRight className="w-5 h-5 ml-4" /> العودة للقيادة
        </SovereignButton>
      </header>

      {/* 🏰 The Registry Grid (Elite UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Right: Asset List (Span 8) */}
        <div className="lg:col-span-8">
           {wishlist.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {wishlist.map((item: any, i) => (
                  <SovereignGlow key={item.id} color={i % 2 === 0 ? "gold" : "blue"}>
                     <GlassPanel className="p-4 group relative h-full flex flex-col justify-between overflow-hidden" gradientBorder>
                         
                         {/* Visual Preview */}
                         <div className="aspect-[4/5] rounded-3xl bg-white/5 overflow-hidden mb-6 relative border border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-40" />
                            <div className="absolute top-6 right-6 z-10 flex gap-2">
                               <Badge className="bg-sovereign-gold text-black text-[9px] font-black px-3 py-1">Heritage Grade</Badge>
                            </div>
                            <button className="absolute top-6 left-6 z-10 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition-transform">
                               <Heart className="w-5 h-5 fill-red-500" />
                            </button>
                            {/* Simulated Image Placeholder */}
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-10">
                               <Gem className="w-24 h-24" />
                            </div>
                         </div>

                         <div className="space-y-4 px-4 pb-6 relative z-10 text-right">
                             <h3 className="text-2xl font-black italic tracking-tight">{item.name_ar || item.name}</h3>
                             <div className="flex items-center gap-6 text-xs font-bold text-muted-foreground opacity-70">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> الجزائر</span>
                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> متاح الآن</span>
                             </div>

                             <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                   <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-40 italic">القيمة اليومية</p>
                                   <p className="text-2xl font-black text-sovereign-gold">{Number(item.price_per_day).toLocaleString()} <span className="text-xs font-normal">DA</span></p>
                                </div>
                                <SovereignButton variant="primary" className="h-12 px-8 rounded-xl shadow-xl shadow-sovereign-gold/10">
                                   احجز الآن
                                </SovereignButton>
                             </div>
                         </div>

                         {/* Hover Shine */}
                         <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] transition-all duration-1000 group-hover:inset-full pointer-events-none" />
                     </GlassPanel>
                  </SovereignGlow>
                ))}
             </div>
           ) : (
             <GlassPanel className="p-24 text-center border-dashed border-white/10 bg-transparent h-[600px] flex flex-col justify-center items-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-10 border border-white/5 shadow-2xl">
                   <Heart className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-4xl font-black italic mb-6">سجل فارغ (Waiting for Majesty)</h3>
                <p className="text-muted-foreground text-xl font-light italic max-w-sm mx-auto leading-relaxed opacity-60">
                   لم تضف أي أصول إلى سجل أمنياتك السيادية حتى الآن. تصفح الكتالوج لبدء بناء إرثك.
                </p>
                <SovereignButton variant="primary" size="xl" onClick={() => router.push('/products')} className="mt-12 h-16 px-16 rounded-2xl" withShimmer>
                   استكشاف الكتالوج <ArrowRight className="w-5 h-5 mr-4" />
                </SovereignButton>
             </GlassPanel>
           )}
        </div>

        {/* Left: System Intelligence (Span 4) */}
        <div className="lg:col-span-4 space-y-10">
           <GlassPanel className="p-10 space-y-10 h-full" gradientBorder>
              <h3 className="text-xl font-black italic flex items-center gap-3">
                 <Zap className="w-6 h-6 text-sovereign-gold" /> ذكاء الأصول (Asset Intel)
              </h3>

              <div className="space-y-8">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <p className="text-xs font-black uppercase text-sovereign-gold opacity-80 tracking-widest">فرص متاحة (Hot Registry)</p>
                    <p className="text-sm italic text-muted-foreground">"هناك 3 قطع في قائمة أمنياتك متاحة حالياً بخصم حصري للنخبة."</p>
                 </div>

                 <div className="pt-6 border-t border-white/5 space-y-6">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                       <span>كفاءة الاختيار</span>
                       <span>92%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full">
                       <div className="h-full w-[92%] bg-sovereign-gold shadow-[0_0_10px_rgba(184,159,103,0.5)]" />
                    </div>
                 </div>
              </div>

              <div className="pt-10 flex items-center justify-center gap-6 opacity-20 transform scale-[0.8] grayscale">
                 <ShieldCheck className="w-12 h-12" />
                 <Gem className="w-12 h-12" />
              </div>
           </GlassPanel>
        </div>

      </div>

      {/* 📜 Bottom Seal (Heritage Completeness) */}
      <div className="pt-20 flex flex-col items-center gap-6 opacity-30">
         <History className="w-12 h-12 text-sovereign-gold" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em]">Digital Heritage Registry Symmetrical Completion V.1</span>
      </div>

    </div>
  );
}
