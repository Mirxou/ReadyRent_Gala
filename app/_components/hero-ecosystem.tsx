'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Repeat, Wrench, Store, ArrowLeft } from 'lucide-react';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const ecosystems = [
  {
    icon: Repeat,
    title: 'الكراء',
    desc: 'استأجر أي شيء تحتاجه — فساتين، قفطانات، أجهزة إلكترونية، سيارات. بسعر يومي مرن مع ضمان الجودة والتوصيل.',
    href: '/rentals',
    gradient: 'from-sovereign-gold/10 via-sovereign-obsidian/95 to-sovereign-gold/5',
    accent: 'sovereign-gold',
  },
  {
    icon: Wrench,
    title: 'الخدمات',
    desc: 'خدمات رقمية كتصميم المواقع والتسويق، أو حقيقية كالتصوير والصيانة. كل الخدمات في مكان واحد.',
    href: '/services',
    gradient: 'from-emerald-500/8 via-sovereign-obsidian/95 to-emerald-500/3',
    accent: 'emerald-400',
  },
  {
    icon: Store,
    title: 'السوق المفتوح',
    desc: 'تسوّق من بائعين وحرفيات محليين في كل أنحاء الجزائر. اكتشف منتجات فريدة وادعم الاقتصاد المحلي.',
    href: '/marketplace',
    gradient: 'from-amber-500/8 via-sovereign-obsidian/95 to-amber-500/3',
    accent: 'amber-400',
  },
];

const accentStyles: Record<string, string> = {
  'sovereign-gold': 'bg-sovereign-gold/10 text-sovereign-gold',
  'emerald-400': 'bg-emerald-400/10 text-emerald-400',
  'amber-400': 'bg-amber-400/10 text-amber-400',
};

export function HeroEcosystem() {
  return (
    <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 md:pt-36 pb-20 md:pb-32 overflow-hidden">
      {/* Ambient glow — subtle, not overwhelming */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-sovereign-gold/6 rounded-full blur-[180px] opacity-40 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center"
        >
          {/* ── Badge: clean pill with shimmer ── */}
          <motion.div custom={0} variants={fadeUp} className="mb-8 sm:mb-10 md:mb-14">
            <div className="inline-flex items-center gap-3 rounded-full border border-sovereign-gold/20 bg-sovereign-gold/5 backdrop-blur-sm px-5 py-2 sm:px-7 sm:py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sovereign-gold/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sovereign-gold" />
              </span>
              <span className="text-xs sm:text-sm font-bold tracking-[0.12em] text-sovereign-gold/90 whitespace-nowrap">
                المنصة الأولى في الجزائر
              </span>
              <span className="text-sovereign-gold/30 text-xs">✦</span>
              <span className="text-xs sm:text-sm font-bold tracking-[0.08em] text-sovereign-gold/60 whitespace-nowrap">
                كراء · خدمات · سوق محلي
              </span>
            </div>
          </motion.div>

          {/* ── STANDARD Logo: clean gradient, single glow ── */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none"
          >
            <span
              className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-sovereign-gold-light via-sovereign-gold to-sovereign-gold/80"
              style={{ textShadow: '0 0 60px rgba(197,160,89,0.25)' }}
            >
              STANDARD
            </span>
          </motion.h1>

          {/* ── Subtitle ── */}
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-3 sm:mt-4 md:mt-5 text-xs sm:text-sm md:text-base font-bold tracking-[0.18em] uppercase text-sovereign-gold/50"
          >
            حيث تبدأ الجزائر المستقبل.
          </motion.p>

          {/* ── Description ── */}
          <motion.div
            custom={3}
            variants={fadeUp}
            className="mt-8 sm:mt-10 md:mt-12 max-w-2xl mx-auto space-y-2.5 sm:space-y-3"
          >
            <p className="text-base sm:text-lg md:text-xl text-foreground/90 font-semibold leading-relaxed sm:leading-relaxed">
              STANDARD ليست مجرد منصة، بل{' '}
              <span className="text-sovereign-gold">نظام حياة رقمي شامل</span>.
            </p>
            <p className="text-sm sm:text-[15px] md:text-base text-muted-foreground leading-relaxed">
              تجمع الكراء، الخدمات، والتجارة المحلية في تجربة واحدة فائقة الذكاء والأمان.
            </p>
            <p className="text-sm sm:text-[15px] md:text-base text-muted-foreground leading-relaxed">
              من الفخامة إلى البساطة، من التقنية إلى الثقة — كل ما تحتاجه في مكان واحد، في كل أنحاء الجزائر.
            </p>
            <p className="text-sm sm:text-[15px] md:text-base text-sovereign-gold/50 font-semibold leading-relaxed">
              STANDARD هو المعيار الجديد للسيادة والابتكار في الجزائر.
            </p>
          </motion.div>
        </motion.div>

        {/* ── Ecosystem Cards ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mt-16 sm:mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
        >
          {ecosystems.map((eco, i) => (
            <motion.div key={eco.title} custom={i + 4} variants={fadeUp}>
              <Link href={eco.href} className="block group h-full">
                <div className={`relative h-full rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-white/[0.04] bg-gradient-to-br ${eco.gradient} backdrop-blur-xl transition-all duration-500 hover:border-white/[0.08] hover:scale-[1.015]`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sovereign-gold/[0.03] rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                  <div className="relative z-10 flex flex-col h-full gap-4 sm:gap-5">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${accentStyles[eco.accent] || ''} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}
                    >
                      <eco.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">{eco.title}</h3>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed flex-1">{eco.desc}</p>
                    <div className="pt-3 sm:pt-4">
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
        </motion.div>
      </div>
    </section>
  );
}
