'use client';

import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

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
        className="max-w-4xl mx-auto text-center relative z-10 space-y-8 md:space-y-12"
      >
        <motion.div variants={fadeUp}>
          <SovereignSparkle active={true}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-6">الانضمام مجاني</p>
          </SovereignSparkle>
        </motion.div>

        <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight">
          انضمي إلى عالم{' '}
          <span className="text-sovereign-gold">STANDARD</span>{' '}
          اليوم
        </motion.h2>

        <motion.p variants={fadeUp} className="text-base md:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
          سجّلي الآن واكتشفي عالماً من الفخامة والخدمات المتميزة. منصة متكاملة تجمع بين الكراء الفاخر وخدمات المناسبات والسوق المحلي.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/register">
            <SovereignButton size="lg" variant="primary" className="h-16 px-12 text-sm rounded-full shadow-2xl shadow-sovereign-gold/20" withShimmer>
              سجّلي الآن مجاناً
              <ArrowLeft className="w-5 h-5" />
            </SovereignButton>
          </Link>
          <Link href="/products">
            <SovereignButton size="lg" variant="secondary" className="h-16 px-12 text-sm rounded-full">
              تصفّحي المنتجات
            </SovereignButton>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
