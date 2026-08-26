'use client';

import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { useRef } from 'react';
import { ArrowLeft, Star, MapPin, Users } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import type { HomepageArtisan } from '@/lib/homepage-data';

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

export function ArtisansGrid({ artisans }: { artisans: HomepageArtisan[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  if (artisans.length === 0) {
    return (
      <section ref={ref} className="py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="flex items-end justify-between mb-10 md:mb-14"
          >
            <motion.div variants={fadeUp}>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">إبداع محلي</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
                حرفيات <span className="text-sovereign-gold">مميزات</span>
              </h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link
                href="/artisans"
                className="flex items-center gap-2 text-sovereign-gold text-sm font-bold hover:gap-3 transition-all"
              >
                <span>عرض الكل</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">لا توجد حرفيات حالياً</p>
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
          className="flex items-end justify-between mb-10 md:mb-14"
        >
          <motion.div variants={fadeUp}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">إبداع محلي</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              حرفيات <span className="text-sovereign-gold">مميزات</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link
              href="/artisans"
              className="flex items-center gap-2 text-sovereign-gold text-sm font-bold hover:gap-3 transition-all"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {artisans.map((artisan, i) => (
            <motion.div
              key={artisan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
            >
              <Link href={`/artisans/${artisan.id}`} className="block group">
                <GlassPanel
                  variant="obsidian"
                  className="p-6 hover:border-sovereign-gold/30 transition-all duration-500 rounded-[2rem] text-center"
                >
                  <div className="relative z-10 space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-sovereign-gold/20 group-hover:border-sovereign-gold/50 transition-colors">
                      <img
                        src={artisan.avatar || artisan.image || '/placeholder-avatar.jpg'}
                        alt={artisan.name_ar || artisan.name || 'حرفية'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight group-hover:text-sovereign-gold transition-colors">
                        {artisan.name_ar || artisan.name || 'حرفية'}
                      </h3>
                      <p className="text-xs text-sovereign-gold/60 font-bold uppercase tracking-widest mt-1">
                        {artisan.specialty_ar || artisan.specialty || 'حرفية محلية'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-sovereign-gold text-sovereign-gold" />
                      <span className="text-sm font-bold">
                        {Number(artisan.rating || 4.8).toFixed(1)}
                      </span>
                    </div>
                    {artisan.location && (
                      <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{artisan.location}</span>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
