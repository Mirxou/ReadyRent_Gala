'use client';

import { motion } from 'framer-motion';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { fadeUp } from './service-data';

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-500/8 rounded-full blur-[200px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div custom={0} variants={fadeUp} className="mb-6">
            <SovereignSparkle active={true}>
              <span className="inline-block px-6 py-2 rounded-full border border-purple-400/20 bg-purple-500/5 text-purple-400 text-[10px] font-black tracking-[0.4em] uppercase backdrop-blur-md">
                خدمات المناسبات
              </span>
            </SovereignSparkle>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
            <SovereignGlow color="purple" intensity="high">
              خدمات <span className="text-purple-400">المناسبات</span>
            </SovereignGlow>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            كل ما تحتاجينه لمناسبتك المثالية
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
