"use client";

import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { SovereignButton } from "@/shared/components/sovereign/sovereign-button";
import { GlassPanel } from "@/shared/components/sovereign/glass-panel";
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { ProductCard } from '@/components/product/product-card';
import { products as mockProducts, artisans as mockArtisans, localGuideServices as mockGuideServices, categories as mockCategories } from '@/lib/mock-data';
import { formatNumber } from '@/lib/utils';
import {
  Shirt,
  Sparkles,
  Store,
  ArrowLeft,
  Star,
  MapPin,
  Camera,
  Palette,
  Music,
  Flower2,
  PartyPopper,
  Users,
  Package,
  Briefcase,
  Smile,
  TrendingUp,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Animation Variants
   ──────────────────────────────────────────── */
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

/* ────────────────────────────────────────────
   Animated Counter Hook
   ──────────────────────────────────────────── */
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  // Use IntersectionObserver directly for reliable detection
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

/* ════════════════════════════════════════════
   SECTION 1 — HERO
   ════════════════════════════════════════════ */
const heroCards = [
  {
    icon: Shirt,
    title: 'الكراء',
    subtitle: 'فساتين، بدلات، قفطان',
    desc: 'استأجري أرقى الملابس الفاخرة لمناسباتك بأسعار تنافسية',
    href: '/rentals',
    gradient: 'from-sovereign-gold/20 via-sovereign-obsidian to-sovereign-gold/5',
  },
  {
    icon: Sparkles,
    title: 'الخدمات',
    subtitle: 'تصوير، مكياج، دج، قاعات',
    desc: 'اكتشفي أفضل مزودي الخدمات لمناسباتك المميزة',
    href: '/services',
    gradient: 'from-purple-500/15 via-sovereign-obsidian to-purple-500/5',
  },
  {
    icon: Store,
    title: 'السوق',
    subtitle: 'بائعون وحرفيات',
    desc: 'سوق مفتوح لبيع وشراء منتجات الحرفيين والبائعين المحليين',
    href: '/marketplace',
    gradient: 'from-emerald-500/15 via-sovereign-obsidian to-emerald-500/5',
  },
];

function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sovereign-gold/8 rounded-full blur-[200px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Brand Heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-16 md:mb-24"
        >
          <motion.div custom={0} variants={fadeUp} className="mb-6">
            <SovereignSparkle active={true}>
              <span className="inline-block px-6 py-2 rounded-full border border-sovereign-gold/20 bg-sovereign-gold/5 text-sovereign-gold text-[10px] font-black tracking-[0.4em] uppercase backdrop-blur-md">
                المنصة الأولى في الجزائر
              </span>
            </SovereignSparkle>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
            <SovereignGlow color="gold" intensity="high">
              STAND<span className="text-sovereign-gold">ARD.</span>
            </SovereignGlow>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="mt-6 md:mt-8 text-lg sm:text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            منصة الكراء الفاخر والخدمات في الجزائر
          </motion.p>
        </motion.div>

        {/* 3 Ecosystem Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6"
        >
          {heroCards.map((card, i) => (
            <motion.div key={card.title} custom={i + 3} variants={fadeUp}>
              <Link href={card.href} className="block group">
                <GlassPanel
                  variant="obsidian"
                  className={`relative p-6 md:p-8 h-full bg-gradient-to-br ${card.gradient} hover:border-sovereign-gold/40 transition-all duration-500 rounded-[2rem]`}
                >
                  <div className="relative z-10 space-y-5">
                    <div className="w-14 h-14 rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold group-hover:bg-sovereign-gold/20 transition-colors">
                      <card.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight">{card.title}</h3>
                      <p className="text-xs text-sovereign-gold/70 font-bold uppercase tracking-widest mt-1">{card.subtitle}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                    <div className="flex items-center gap-2 text-sovereign-gold text-xs font-bold uppercase tracking-widest pt-2 group-hover:gap-3 transition-all">
                      <span>اكتشفي الآن</span>
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 2 — FEATURED PRODUCTS
   ════════════════════════════════════════════ */
function FeaturedProducts() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  const featured = mockProducts?.slice(0, 4) || [];

  return (
    <section ref={sectionRef} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="flex items-end justify-between mb-10 md:mb-14"
        >
          <motion.div variants={fadeUp}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">التحديد السيادي</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              المنتجات <span className="text-sovereign-gold">المميزة</span>
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

        {/* Horizontal Scrollable Row */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {featured.map((product: any, i: number) => (
            <motion.div
              key={product.id || i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
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
   SECTION 3 — THE 3 ECOSYSTEMS
   ════════════════════════════════════════════ */
const ecosystems = [
  {
    icon: Shirt,
    title: 'الكراء الفاخر',
    desc: 'اكتشفي مجموعة واسعة من الفساتين والبدلات والقفطانات الفاخرة. استأجري بأفضل الأسعار مع ضمان الجودة والنظافة لكل مناسبة.',
    href: '/rentals',
    gradient: 'from-sovereign-gold/15 via-sovereign-obsidian/90 to-sovereign-gold/5',
    accent: 'sovereign-gold',
  },
  {
    icon: Sparkles,
    title: 'خدمات المناسبات',
    desc: 'اعثري على أفضل المصورين ومجمّلي الأزياء ومقدمي الدي جي وقاعات الأفراح. كل ما تحتاجينه لمناسبتك المثالية في مكان واحد.',
    href: '/services',
    gradient: 'from-purple-500/12 via-sovereign-obsidian/90 to-purple-500/5',
    accent: 'purple-400',
  },
  {
    icon: Store,
    title: 'السوق المفتوح',
    desc: 'تسوقي من بائعين وحرفيات محليين. اكتشفي منتجات فريدة مصنوعة يدوياً وادعمي الأعمال المحلية في الجزائر.',
    href: '/marketplace',
    gradient: 'from-emerald-500/12 via-sovereign-obsidian/90 to-emerald-500/5',
    accent: 'emerald-400',
  },
];

const accentStyles: Record<string, string> = {
  'sovereign-gold': 'bg-sovereign-gold/10 text-sovereign-gold',
  'purple-400': 'bg-purple-400/10 text-purple-400',
  'emerald-400': 'bg-emerald-400/10 text-emerald-400',
};

function EcosystemsSection() {
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
          <motion.p variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">المنظومة المتكاملة</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
            النظام البيئي <span className="text-sovereign-gold">الثلاثي</span>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {ecosystems.map((eco, i) => (
            <motion.div
              key={eco.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.32, 0.72, 0, 1] }}
            >
              <Link href={eco.href} className="block group h-full">
                <div className={`relative h-full rounded-[2.5rem] p-8 md:p-10 border border-white/5 bg-gradient-to-br ${eco.gradient} backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-white/10 hover:scale-[1.02]`}>
                  {/* Internal Glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-sovereign-gold/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

                  <div className="relative z-10 flex flex-col h-full gap-6">
                    <div className={`w-16 h-16 rounded-2xl ${accentStyles[eco.accent] || ''} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                      <eco.icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">{eco.title}</h3>

                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">{eco.desc}</p>

                    <div className="pt-4">
                      <SovereignButton variant="secondary" size="sm" className="w-full">
                        <span>استكشفي</span>
                        <ArrowLeft className="w-4 h-4" />
                      </SovereignButton>
                    </div>
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
   SECTION 4 — ARTISANS SPOTLIGHT
   ════════════════════════════════════════════ */
function ArtisansSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const artisans = mockArtisans?.slice(0, 4) || [];

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
          {artisans.map((artisan: any, i: number) => (
            <motion.div
              key={artisan.id || i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
            >
              <Link href="/artisans" className="block group">
                <GlassPanel
                  variant="obsidian"
                  className="p-6 hover:border-sovereign-gold/30 transition-all duration-500 rounded-[2rem] text-center"
                >
                  <div className="relative z-10 space-y-4">
                    {/* Avatar */}
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-sovereign-gold/20 group-hover:border-sovereign-gold/50 transition-colors">
                      <img
                        src={artisan.avatar || `https://picsum.photos/seed/artisan${i}/200/200`}
                        alt={artisan.name_ar || 'حرفية'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-black tracking-tight group-hover:text-sovereign-gold transition-colors">
                        {artisan.name_ar || 'حرفية'}
                      </h3>
                      <p className="text-xs text-sovereign-gold/60 font-bold uppercase tracking-widest mt-1">
                        {artisan.specialty || 'حرفية محلية'}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-sovereign-gold text-sovereign-gold" />
                      <span className="text-sm font-bold">
                        {Number(artisan.rating || 4.8).toFixed(1)}
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
   SECTION 5 — SERVICES CATEGORIES
   ════════════════════════════════════════════ */
const defaultServiceCategories = [
  { icon: PartyPopper, name: 'أعراس', desc: 'تنظيم وتجهيز حفلات الزفاف والمناسبات الكبرى', slug: 'weddings' },
  { icon: Camera, name: 'تصوير', desc: 'مصورون محترفون لكل لحظة مميزة', slug: 'photography' },
  { icon: Palette, name: 'مكياج', desc: 'مجمّلات أزياء محترفات لكل ذوق', slug: 'makeup' },
  { icon: Music, name: 'دج', desc: 'دي جي محترفون لموسيقى لا تُنسى', slug: 'dj' },
  { icon: Flower2, name: 'زهور', desc: 'تنسيق زهور فاخر لجميع المناسبات', slug: 'flowers' },
  { icon: PartyPopper, name: 'حفلات', desc: 'تنظيم حفلات خاصة وشاملة', slug: 'parties' },
];

function ServicesCategories() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const categories = mockCategories?.length ? mockCategories.slice(0, 6) : defaultServiceCategories;

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
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">دليل الخدمات</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              خدمات <span className="text-sovereign-gold">المناسبات</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Link
              href="/services"
              className="flex items-center gap-2 text-sovereign-gold text-sm font-bold hover:gap-3 transition-all"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {categories.map((cat: any, i: number) => {
            const IconComp = cat.icon || (defaultServiceCategories[i]?.icon) || Sparkles;
            return (
              <motion.div
                key={cat.id || cat.slug || i}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
              >
                <Link href="/services" className="block group">
                  <div className="relative p-5 md:p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-sovereign-gold/20 hover:bg-sovereign-gold/5 transition-all duration-500 text-center h-full">
                    <div className="space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold group-hover:scale-110 transition-transform duration-500">
                        {typeof IconComp === 'string' ? (
                          <Sparkles className="w-6 h-6" />
                        ) : (
                          <IconComp className="w-6 h-6" />
                        )}
                      </div>
                      <h3 className="text-sm md:text-base font-black tracking-tight group-hover:text-sovereign-gold transition-colors">
                        {cat.name_ar || cat.name || 'خدمة'}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 hidden sm:block">
                        {cat.description || cat.desc || ''}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   SECTION 6 — STATISTICS BAR
   ════════════════════════════════════════════ */
const stats = [
  { value: 500, suffix: '+', label: 'منتج', icon: Package },
  { value: 50, suffix: '+', label: 'حرفية', icon: Users },
  { value: 120, suffix: '+', label: 'خدمة', icon: Briefcase },
  { value: 2000, suffix: '+', label: 'عميل سعيد', icon: Smile },
];

function StatisticsBar() {
  return (
    <section className="py-16 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <GlassPanel variant="gold" className="rounded-[2.5rem] p-8 md:p-10">
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {stats.map((stat, i) => (
                <StatItem key={stat.label} stat={stat} index={i} />
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}

function StatItem({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const { count, ref } = useAnimatedCounter(stat.value);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.32, 0.72, 0, 1] }}
      className="text-center space-y-2"
    >
      <div className="w-10 h-10 mx-auto rounded-xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold mb-2">
        <stat.icon className="w-5 h-5" />
      </div>
      <p className="text-3xl md:text-4xl font-black tracking-tighter text-sovereign-gold">
        {formatNumber(count)}<span className="text-xl">{stat.suffix}</span>
      </p>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   SECTION 7 — CTA SECTION
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

/* ════════════════════════════════════════════
   PAGE — HOME
   ════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl">
      <HeroSection />
      <FeaturedProducts />
      <EcosystemsSection />
      <ArtisansSpotlight />
      <ServicesCategories />
      <StatisticsBar />
      <CTASection />
    </div>
  );
}