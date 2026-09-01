'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { fadeUp, staggerContainer } from './service-data';

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 md:py-40 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[600px] md:h-[900px] bg-sovereign-gold/10 rounded-full blur-[160px] opacity-20 animate-pulse pointer-events-none" />

      <motion.div
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={staggerContainer}
        className="max-w-4xl mx-auto text-center relative z-10 space-y-8"
      >
        <motion.div variants={fadeUp}>
          <SovereignSparkle active={true}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-6">مناسبتك تنتظرك</p>
          </SovereignSparkle>
        </motion.div>

        <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-tight">
          اكتشفي جميع <span className="text-sovereign-gold">الخدمات</span>
        </motion.h2>

        <motion.p variants={fadeUp} className="text-base md:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
          اعثري على أفضل مزودي الخدمات في الجزائر. من المصورين المحترفين إلى دي جي الحفلات، كل ما تحتاجينه لمناسبتك المثالية.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/services">
            <SovereignButton size="lg" variant="primary" className="h-16 px-12 text-sm rounded-full shadow-2xl shadow-sovereign-gold/20 bg-emerald-600 hover:bg-emerald-700" withShimmer>
              اكتشفي جميع الخدمات
              <ArrowLeft className="w-5 h-5" />
            </SovereignButton>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
