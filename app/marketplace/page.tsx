"use client";

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { SovereignButton } from "@/shared/components/sovereign/sovereign-button";
import { GlassPanel } from "@/shared/components/sovereign/glass-panel";
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { vendors, artisans } from '@/lib/mock-data';
import {
  Star,
  MapPin,
  ArrowLeft,
  Store,
  BadgeCheck,
  Package,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Animation Variants
   ──────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ════════════════════════════════════════════
   SECTION 1 — HERO
   ════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/8 rounded-full blur-[200px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div custom={0} variants={fadeUp} className="mb-6">
            <SovereignSparkle active={true}>
              <span className="inline-block px-6 py-2 rounded-full border border-emerald-400/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-black tracking-[0.4em] uppercase backdrop-blur-md">
                السوق الرقمي
              </span>
            </SovereignSparkle>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
            <SovereignGlow color="emerald" intensity="high">
              السوق <span className="text-emerald-400">المفتوح</span>
            </SovereignGlow>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            سوق رقمي للحرفيين والبائعين المحليين
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 2 — FEATURED VENDORS
   ════════════════════════════════════════════ */
function FeaturedVendors() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="flex items-end justify-between mb-10 md:mb-14"
        >
          <motion.div variants={fadeUp}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60 mb-3">البائعون المميزون</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              بائعون <span className="text-emerald-400">موثوقون</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link
              href="/vendors"
              className="flex items-center gap-2 text-emerald-400 text-sm font-bold hover:gap-3 transition-all"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {vendors.map((vendor: any, i: number) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
            >
              <Link href="/vendors" className="block group h-full">
                <GlassPanel
                  variant="obsidian"
                  className="p-6 md:p-8 hover:border-emerald-400/20 transition-all duration-500 rounded-[2rem] h-full"
                >
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-emerald-400/30 transition-colors flex-shrink-0">
                        <img
                          src={vendor.avatar}
                          alt={vendor.name_ar}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black tracking-tight group-hover:text-emerald-400 transition-colors truncate">
                            {vendor.name_ar}
                          </h3>
                          {vendor.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                            <span className="text-sm font-bold">{Number(vendor.rating).toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <MapPin className="w-3 h-3" />
                            <span>{vendor.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {vendor.description_ar}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Package className="w-3 h-3" />
                        <span>{vendor.product_count} منتج</span>
                      </div>
                      {vendor.trust_score && (
                        <div className="px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[11px] font-bold">
                          نقاط ثقة {vendor.trust_score}%
                        </div>
                      )}
                    </div>
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

/* ════════════════════════════════════════════
   SECTION 3 — FEATURED ARTISANS
   ════════════════════════════════════════════ */
function FeaturedArtisans() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const featured = artisans.slice(0, 4);

  return (
    <section ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="flex items-end justify-between mb-10 md:mb-14"
        >
          <motion.div variants={fadeUp}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60 mb-3">إبداع محلي</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              حرفيات <span className="text-emerald-400">مميزات</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link
              href="/artisans"
              className="flex items-center gap-2 text-emerald-400 text-sm font-bold hover:gap-3 transition-all"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {featured.map((artisan: any, i: number) => (
            <motion.div
              key={artisan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
            >
              <Link href={`/artisans/${artisan.id}`} className="block group h-full">
                <GlassPanel
                  variant="obsidian"
                  className="p-6 hover:border-emerald-400/20 transition-all duration-500 rounded-[2rem] text-center h-full"
                >
                  <div className="relative z-10 space-y-4">
                    {/* Avatar */}
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white/10 group-hover:border-emerald-400/50 transition-colors">
                      <img
                        src={artisan.avatar}
                        alt={artisan.name_ar}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-black tracking-tight group-hover:text-emerald-400 transition-colors">
                        {artisan.name_ar}
                      </h3>
                      <p className="text-xs text-emerald-400/60 font-bold uppercase tracking-widest mt-1">
                        {artisan.specialty_ar}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                      <span className="text-sm font-bold">
                        {Number(artisan.rating).toFixed(1)}
                      </span>
                    </div>

                    {/* Location */}
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

/* ════════════════════════════════════════════
   SECTION 4 — CTA
   ════════════════════════════════════════════ */
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 md:py-40 px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[600px] md:h-[900px] bg-emerald-500/10 rounded-full blur-[160px] opacity-20 animate-pulse pointer-events-none" />

      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="max-w-4xl mx-auto text-center relative z-10 space-y-8"
      >
        <motion.div variants={fadeUp}>
          <SovereignSparkle active={true}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60 mb-6">انضمي للسوق</p>
          </SovereignSparkle>
        </motion.div>

        <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-tight">
          سجّلي <span className="text-emerald-400">كبائعة</span> اليوم
        </motion.h2>

        <motion.p variants={fadeUp} className="text-base md:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
          انضمي إلى مجتمع من الحرفيات والبائعين المحليين في الجزائر. اعرضي منتجاتك ووصولي لآلاف العملاء المحتملين.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/register">
            <SovereignButton size="lg" variant="primary" className="h-16 px-12 text-sm rounded-full shadow-2xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700" withShimmer>
              سجّلي كبائعة
              <ArrowLeft className="w-5 h-5" />
            </SovereignButton>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ════════════════════════════════════════════
   PAGE — MARKETPLACE
   ════════════════════════════════════════════ */
export default function MarketplacePage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl">
      <HeroSection />
      <FeaturedVendors />
      <FeaturedArtisans />
      <CTASection />
    </div>
  );
}