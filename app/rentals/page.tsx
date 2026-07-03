"use client";

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { SovereignButton } from "@/shared/components/sovereign/sovereign-button";
import { GlassPanel } from "@/shared/components/sovereign/glass-panel";
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { ProductCard } from '@/components/product/product-card';
import { products, categories } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import {
  Search,
  Calendar,
  Package,
  ArrowLeft,
  Shirt,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Animation Variants
   ──────────────────────────────────────────── */
const fadeUp = {
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

/* ════════════════════════════════════════════
   SECTION 1 — HERO
   ════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sovereign-gold/8 rounded-full blur-[200px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.div custom={0} variants={fadeUp} className="mb-6">
            <SovereignSparkle active={true}>
              <span className="inline-block px-6 py-2 rounded-full border border-sovereign-gold/20 bg-sovereign-gold/5 text-sovereign-gold text-[10px] font-black tracking-[0.4em] uppercase backdrop-blur-md">
                كراء فاخر
              </span>
            </SovereignSparkle>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
            <SovereignGlow color="gold" intensity="high">
              الكراء <span className="text-sovereign-gold">الفاخر</span>
            </SovereignGlow>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto mb-10">
            اكتشفي أرقى الملابس الفاخرة لمناسباتك في الجزائر
          </motion.p>

          {/* Decorative Search Input */}
          <motion.div custom={3} variants={fadeUp} className="max-w-xl mx-auto">
            <Link href="/products">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 rounded-2xl bg-sovereign-gold/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3 px-6 py-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl group-hover:border-sovereign-gold/30 transition-all duration-500">
                  <Search className="w-5 h-5 text-sovereign-gold/60 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">ابحثي عن فستان، قفطان، بدلة...</span>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 2 — FEATURED CATEGORIES
   ════════════════════════════════════════════ */
function CategoriesGrid() {
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
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">التصنيفات</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              تصفّحي <span className="text-sovereign-gold">التصنيفات</span>
            </h2>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
            >
              <Link href={`/products?category=${cat.slug}`} className="block group h-full">
                <div className="relative p-5 md:p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-sovereign-gold/20 hover:bg-sovereign-gold/5 transition-all duration-500 text-center h-full">
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden border border-white/10 group-hover:border-sovereign-gold/30 transition-colors">
                      <img
                        src={cat.icon}
                        alt={cat.name_ar}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-sm md:text-base font-black tracking-tight group-hover:text-sovereign-gold transition-colors">
                      {cat.name_ar}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {cat.product_count} منتج
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 3 — FEATURED PRODUCTS
   ════════════════════════════════════════════ */
function FeaturedProducts() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const featured = products.slice(0, 8);

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
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">التحديد السيادي</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              منتجات <span className="text-sovereign-gold">مميزة</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link
              href="/products"
              className="flex items-center gap-2 text-sovereign-gold text-sm font-bold hover:gap-3 transition-all"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product: any, i: number) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 4 — HOW IT WORKS
   ════════════════════════════════════════════ */
const steps = [
  {
    icon: Search,
    title: 'تصفّحي',
    desc: 'استكشفي مجموعتنا الواسعة من الملابس الفاخرة واختاري ما يناسب مناسبتك',
    step: '١',
  },
  {
    icon: Calendar,
    title: 'احجزي',
    desc: 'حدّدي التواريخ وأكملي الحجز بسهولة مع خيارات الدفع المختلفة',
    step: '٢',
  },
  {
    icon: Package,
    title: 'استلمي',
    desc: 'استلمي ملابسك نظيفة ومكوية في الموعد المحدد مع ضمان الجودة',
    step: '٣',
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-14 md:mb-20"
        >
          <motion.p variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">بكل سهولة</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
            كيف <span className="text-sovereign-gold">يعمل؟</span>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.32, 0.72, 0, 1] }}
            >
              <GlassPanel
                variant="obsidian"
                className="p-8 md:p-10 rounded-[2.5rem] text-center h-full hover:border-sovereign-gold/20 transition-all duration-500"
              >
                <div className="relative z-10 space-y-6">
                  {/* Step Number */}
                  <div className="text-5xl font-black text-sovereign-gold/10 absolute top-4 left-6">
                    {step.step}
                  </div>

                  <div className="w-16 h-16 mx-auto rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold">
                    <step.icon className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 5 — CTA
   ════════════════════════════════════════════ */
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 md:py-40 px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[600px] md:h-[900px] bg-sovereign-gold/10 rounded-full blur-[160px] opacity-20 animate-pulse pointer-events-none" />

      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="max-w-4xl mx-auto text-center relative z-10 space-y-8"
      >
        <motion.div variants={fadeUp}>
          <SovereignSparkle active={true}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-6">جاهزة للتميّز؟</p>
          </SovereignSparkle>
        </motion.div>

        <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-tight">
          ابدئي <span className="text-sovereign-gold">الكراء</span> الآن
        </motion.h2>

        <motion.p variants={fadeUp} className="text-base md:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
          اكتشفي مجموعة واسعة من الفساتين والقفطانات والبدلات الفاخرة. استأجري بأفضل الأسعار مع ضمان الجودة.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/products">
            <SovereignButton size="lg" variant="primary" className="h-16 px-12 text-sm rounded-full shadow-2xl shadow-sovereign-gold/20" withShimmer>
              تصفّحي المنتجات
              <ArrowLeft className="w-5 h-5" />
            </SovereignButton>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ════════════════════════════════════════════
   PAGE — RENTALS
   ════════════════════════════════════════════ */
export default function RentalsPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl">
      <HeroSection />
      <CategoriesGrid />
      <FeaturedProducts />
      <HowItWorks />
      <CTASection />
    </div>
  );
}