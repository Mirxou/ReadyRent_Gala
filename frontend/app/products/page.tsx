"use client";

import { motion } from 'framer-motion';
import { ProductSearch } from '@/components/product/product-search';
import { ParticleField } from '@/components/ui/particle-field';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { Badge } from '@/components/ui/badge';

export default function ProductsPage() {
  return (
    <div className="relative min-h-screen pb-40 bg-background overflow-hidden" dir="rtl">
      
      {/* 🌌 Atmospheric Backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-sovereign-gold/5 rounded-full blur-[140px] opacity-30" />
        <div className="absolute bottom-1/2 left-0 w-[800px] h-[800px] bg-sovereign-blue/5 rounded-full blur-[140px] opacity-40 animate-pulse" />
      </div>

      <div className="container mx-auto px-6 py-24 relative z-10 space-y-24">
        
        {/* 🏆 The Grand Sovereign Catalog Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="text-center space-y-8"
        >
          <div className="flex justify-center">
             <SovereignSparkle active={true}>
                <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-8 py-3 text-[10px] font-black uppercase tracking-[0.4em] bg-sovereign-gold/5 italic shadow-2xl">
                   ReadyRent Sovereign Archives
                </Badge>
             </SovereignSparkle>
          </div>

          <div className="relative flex justify-center">
             <SovereignGlow color="gold">
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-foreground italic select-none">
                   كتالوج <span className="text-sovereign-gold">2026.</span>
                </h1>
             </SovereignGlow>
          </div>

          <p className="text-2xl text-muted-foreground max-w-3xl mx-auto italic font-light opacity-80 leading-relaxed">
             "اكتشف نخبة الأصول المختارة بعناية لتناسب أرقى المناسبات في الجزائر. كل قطعة هنا هي ميثاق ثقة بحد ذاتها."
          </p>

          <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-40">
             <span>Elite Quality Control</span>
             <span className="w-1 h-1 rounded-full bg-white/20" />
             <span>Sovereign Security</span>
          </div>
        </motion.div>

        {/* 🧭 The Search & Results Tactical Hub */}
        <ProductSearch />

      </div>

      <BookingWizard />
    </div>
  );
}
