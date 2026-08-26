'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  Repeat,
  Wrench,
  Store,
  ArrowLeft,
  Shield,
  MapPin,
  Clock,
} from 'lucide-react';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';

/* ─── Animation Tokens ─── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.08,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Feature Data ─── */

const features = [
  {
    icon: Repeat,
    title: 'الكراء',
    desc: 'استأجر أي شيء تحتاجه بضمان الجودة والتوصيل',
    href: '/rentals',
  },
  {
    icon: Wrench,
    title: 'الخدمات',
    desc: 'خدمات رقمية وحقيقية من محترفين جزائريين',
    href: '/services',
  },
  {
    icon: Store,
    title: 'السوق المفتوح',
    desc: 'منتجات فريدة من بائعين وحرفيات محليين',
    href: '/marketplace',
  },
];

/* ─── Trust Stats ─── */

const stats = [
  { value: '10,000+', label: 'منتج', icon: null as React.ComponentType<{ className?: string }> | null },
  { value: '48', label: 'ولاية', icon: MapPin },
  { value: 'ضمان', label: 'الأمان', icon: Shield },
  { value: '24/7', label: 'دعم', icon: Clock },
];

/* ─── Component ─── */

export function HeroEcosystem() {
  return (
    <section className="relative px-4 sm:px-6 pt-20 sm:pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
      {/* Subtle Noise Texture Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
        aria-hidden="true"
      />

      {/* Gradient Mesh Background */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 20%, rgba(197,160,89,0.4), transparent), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(223,189,132,0.3), transparent)',
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Hero Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center"
        >
          {/* Badge */}
          <motion.div custom={0} variants={fadeUp} className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sovereign-gold/20 bg-sovereign-gold/[0.06] px-4 py-1.5 sm:px-6 sm:py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.12em] text-sovereign-gold/90 whitespace-nowrap">
                المنصة الأولى في الجزائر
              </span>
              <span className="text-sovereign-gold/25 text-[10px]">✦</span>
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.08em] text-sovereign-gold/60 whitespace-nowrap">
                كراء · خدمات · سوق محلي
              </span>
            </div>
          </motion.div>

          {/* STANDARD Logo */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] not-italic"
          >
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-sovereign-gold-light via-sovereign-gold to-sovereign-gold/70">
              STANDARD
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-3 sm:mt-4 text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-sovereign-gold/50 not-italic"
          >
            حيث تبدأ الجزائر المستقبل.
          </motion.p>

          {/* Description */}
          <motion.p
            custom={3}
            variants={fadeUp}
            className="mt-6 sm:mt-8 max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-foreground/80 leading-relaxed not-italic"
          >
            STANDARD ليست مجرد منصة، بل نظام حياة رقمي شامل يجمع الكراء والخدمات
            والتجارة المحلية في تجربة واحدة آمنة.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            custom={4}
            variants={fadeUp}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <SovereignButton variant="primary" size="md" href="/register" className="!h-12 !px-8 !text-sm !tracking-[0.08em]">
              ابدأ الآن
            </SovereignButton>
            <SovereignButton variant="secondary" size="md" href="/products" className="!h-12 !px-8 !text-sm !tracking-[0.08em]">
              <span>اكتشف المنتجات</span>
              <ArrowLeft className="w-4 h-4" />
            </SovereignButton>
          </motion.div>
        </motion.div>

        {/* Bento Feature Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mt-16 sm:mt-20 md:mt-28"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 sm:gap-5">
            {/* Card 1: الكراء (tall — spans 2 rows on desktop) */}
            <motion.div custom={0} variants={fadeUp} className="md:row-span-2">
              <Link href={features[0].href} className="block group h-full">
                <div className="relative h-full rounded-2xl p-6 sm:p-8 md:p-10 border border-white/[0.06] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
                  <div className="flex flex-col h-full">
                    <div className="w-11 h-11 rounded-xl bg-sovereign-gold/10 flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-105 transition-transform duration-300">
                      <Repeat className="w-5 h-5 text-sovereign-gold" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-3 not-italic">
                      {features[0].title}
                    </h3>
                    <p className="text-sm text-foreground/60 leading-relaxed not-italic">
                      {features[0].desc}
                    </p>
                    <div className="mt-auto pt-6 sm:pt-8 flex items-center gap-2 text-sovereign-gold/50 group-hover:text-sovereign-gold/80 transition-colors duration-300">
                      <span className="text-xs font-bold tracking-wider">استكشف</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Card 2: الخدمات */}
            <motion.div custom={1} variants={fadeUp}>
              <Link href={features[1].href} className="block group h-full">
                <div className="relative h-full rounded-2xl p-6 sm:p-8 border border-white/[0.06] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
                  <div className="flex flex-col h-full">
                    <div className="w-11 h-11 rounded-xl bg-sovereign-gold/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform duration-300">
                      <Wrench className="w-5 h-5 text-sovereign-gold" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2 not-italic">
                      {features[1].title}
                    </h3>
                    <p className="text-sm text-foreground/60 leading-relaxed not-italic">
                      {features[1].desc}
                    </p>
                    <div className="mt-auto pt-4 sm:pt-5 flex items-center gap-2 text-sovereign-gold/50 group-hover:text-sovereign-gold/80 transition-colors duration-300">
                      <span className="text-xs font-bold tracking-wider">استكشف</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Card 3: السوق المفتوح */}
            <motion.div custom={2} variants={fadeUp}>
              <Link href={features[2].href} className="block group h-full">
                <div className="relative h-full rounded-2xl p-6 sm:p-8 border border-white/[0.06] bg-white/[0.03] transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
                  <div className="flex flex-col h-full">
                    <div className="w-11 h-11 rounded-xl bg-sovereign-gold/10 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform duration-300">
                      <Store className="w-5 h-5 text-sovereign-gold" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2 not-italic">
                      {features[2].title}
                    </h3>
                    <p className="text-sm text-foreground/60 leading-relaxed not-italic">
                      {features[2].desc}
                    </p>
                    <div className="mt-auto pt-4 sm:pt-5 flex items-center gap-2 text-sovereign-gold/50 group-hover:text-sovereign-gold/80 transition-colors duration-300">
                      <span className="text-xs font-bold tracking-wider">استكشف</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Trust Stats Bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mt-12 sm:mt-16"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={fadeUp}
                className="flex items-center gap-2.5"
              >
                {stat.icon && <stat.icon className="w-3.5 h-3.5 text-sovereign-gold/40" />}
                <span className="text-sm sm:text-base font-black text-sovereign-gold/90 tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm text-foreground/40 not-italic">
                  {stat.label}
                </span>
                {i < stats.length - 1 && (
                  <span className="hidden sm:block w-px h-4 bg-white/[0.08] mr-6 sm:mr-8" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
