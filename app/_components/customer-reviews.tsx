'use client';

import { motion, useInView, type Variants } from 'framer-motion';
import { useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { ReviewList } from '@/components/reviews/review-list';
import type { HomepageReview } from '@/lib/homepage-data';

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

export function CustomerReviews({ reviews }: { reviews: HomepageReview[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  if (reviews.length === 0) {
    return (
      <section ref={ref} className="py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="text-center mb-14 md:mb-16"
          >
            <motion.div variants={fadeUp} className="mb-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold mb-4">
                <MessageCircle className="w-7 h-7" />
              </div>
            </motion.div>
            <motion.p variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">
              تقييمات العملاء
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              ماذا يقول <span className="text-sovereign-gold">عملاؤنا</span>
            </motion.h2>
            <motion.div variants={fadeUp} className="mt-4">
              <SovereignGlow color="gold" intensity="low">
                <div className="h-1 w-24 bg-sovereign-gold/60 mx-auto rounded-full" />
              </SovereignGlow>
            </motion.div>
          </motion.div>
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">لا توجد تقييمات حالياً</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="text-center mb-14 md:mb-16"
        >
          <motion.div variants={fadeUp} className="mb-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold mb-4">
              <MessageCircle className="w-7 h-7" />
            </div>
          </motion.div>
          <motion.p variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">
            تقييمات العملاء
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
            ماذا يقول <span className="text-sovereign-gold">عملاؤنا</span>
          </motion.h2>
          <motion.div variants={fadeUp} className="mt-4">
            <SovereignGlow color="gold" intensity="low">
              <div className="h-1 w-24 bg-sovereign-gold/60 mx-auto rounded-full" />
            </SovereignGlow>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] }}
            >
              <GlassPanel
                variant="obsidian"
                className="p-6 hover:border-sovereign-gold/30 transition-all duration-500 rounded-[2rem] h-full"
              >
                <div className="relative z-10">
                  {/* ReviewList expects the original shape with user relation */}
                  <ReviewList reviews={[review as unknown as Parameters<typeof ReviewList>[0]['reviews'][0]]} />
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
