"use client";

import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { SovereignButton } from "@/shared/components/sovereign/sovereign-button";
import { GlassPanel } from "@/shared/components/sovereign/glass-panel";
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { FeaturedProducts } from '@/components/product/featured-products';
import { ReviewList } from '@/components/reviews/review-list';
import { artisansApi, reviewsApi } from '@/lib/api';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';
import { formatNumber } from '@/lib/utils';
import {
  Shirt,
  Sparkles,
  Store,
  ArrowLeft,
  Star,
  MapPin,
  Users,
  Package,
  Briefcase,
  Smile,
  MessageCircle,
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
   HERO — النظام البيئي الثلاثي
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

function HeroEcosystem() {
  return (
    <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sovereign-gold/8 rounded-full blur-[200px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Brand Heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
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

          <motion.p custom={2} variants={fadeUp} className="mt-4 md:mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60">
            النظام البيئي الثلاثي
          </motion.p>

          <motion.p custom={3} variants={fadeUp} className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            منصة الكراء الفاخر وخدمات المناسبات والسوق المحلي في الجزائر
          </motion.p>
        </motion.div>

        {/* 3 Ecosystem Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {ecosystems.map((eco, i) => (
            <motion.div key={eco.title} custom={i + 4} variants={fadeUp}>
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
                      <div onClick={() => window.location.href = eco.href}>
                        <SovereignButton variant="secondary" size="sm" className="w-full">
                          <span>استكشفي</span>
                          <ArrowLeft className="w-4 h-4" />
                        </SovereignButton>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   ARTISANS SPOTLIGHT
   ════════════════════════════════════════════ */
function ArtisansSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [artisans, setArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    artisansApi.getAll({ limit: 4 }).then((res) => {
      if (res.data && !res.data.error && Array.isArray(res.data)) {
        setArtisans(res.data.slice(0, 4));
      } else if (res.data?.results && Array.isArray(res.data.results)) {
        setArtisans(res.data.results.slice(0, 4));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

        {loading ? (
          <DignifiedLoader label="جاري تحميل الحرفيات..." subLabel="يرجى الانتظار" className="py-12" />
        ) : artisans.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">لا توجد حرفيات حالياً</p>
          </div>
        ) : (
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
                          src={artisan.avatar || artisan.image || `https://picsum.photos/seed/artisan${i}/200/200`}
                          alt={artisan.name_ar || artisan.name || 'حرفية'}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-black tracking-tight group-hover:text-sovereign-gold transition-colors">
                          {artisan.name_ar || artisan.name || 'حرفية'}
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
        )}
      </div>
    </section>
  );
}



/* ════════════════════════════════════════════
   CUSTOMER REVIEWS
   ════════════════════════════════════════════ */
function CustomerReviewsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewsApi.getAll({ limit: 3 }).then((res) => {
      if (res.data && !res.data.error && Array.isArray(res.data)) {
        setReviews(res.data.slice(0, 3));
      } else if (res.data?.results && Array.isArray(res.data.results)) {
        setReviews(res.data.results.slice(0, 3));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <section ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
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

        {loading ? (
          <DignifiedLoader label="جاري تحميل التقييمات..." subLabel="يرجى الانتظار" className="py-12" />
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">لا توجد تقييمات حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review: any, i: number) => (
              <motion.div
                key={review.id || i}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] }}
              >
                <GlassPanel
                  variant="obsidian"
                  className="p-6 hover:border-sovereign-gold/30 transition-all duration-500 rounded-[2rem] h-full"
                >
                  <div className="relative z-10">
                    <ReviewList reviews={[review]} />
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   STATISTICS BAR
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
   CTA SECTION
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
      <HeroEcosystem />
      <FeaturedProducts />
      <ArtisansSpotlight />
      <CustomerReviewsSection />
      <StatisticsBar />
      <CTASection />
    </div>
  );
}