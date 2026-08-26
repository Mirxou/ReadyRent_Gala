'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Repeat, Wrench, Store, ArrowLeft } from 'lucide-react';
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

const ecosystems = [
  {
    icon: Repeat,
    title: 'الكراء',
    desc: 'استأجر أي شيء تحتاجه — فساتين، قفطانات، أجهزة إلكترونية، سيارات، أو أي منتج آخر. بسعر يومي مرن مع ضمان الجودة والتوصيل.',
    href: '/rentals',
    gradient: 'from-sovereign-gold/15 via-sovereign-obsidian/90 to-sovereign-gold/5',
    accent: 'sovereign-gold',
  },
  {
    icon: Wrench,
    title: 'الخدمات',
    desc: 'اعثر على أي خدمة تحتاجها — رقمية كانت كتصميم المواقع والتسويق، أو حقيقية كالتصوير والصيانة والتجميل. كل الخدمات في مكان واحد.',
    href: '/services',
    gradient: 'from-emerald-500/12 via-sovereign-obsidian/90 to-emerald-500/5',
    accent: 'emerald-400',
  },
  {
    icon: Store,
    title: 'السوق المفتوح',
    desc: 'تسوّق من بائعين وحرفيات محليين في كل أنحاء الجزائر. اكتشف منتجات فريدة مصنوعة يدوياً وادعم الاقتصاد المحلي.',
    href: '/marketplace',
    gradient: 'from-amber-500/12 via-sovereign-obsidian/90 to-amber-500/5',
    accent: 'amber-400',
  },
];

const accentStyles: Record<string, string> = {
  'sovereign-gold': 'bg-sovereign-gold/10 text-sovereign-gold',
  'emerald-400': 'bg-emerald-400/10 text-emerald-400',
  'amber-400': 'bg-amber-400/10 text-amber-400',
};

const CIRCLE_TEXT = 'المنصة الأولى في الجزائر ✦ كراء · خدمات · سوق محلي ✦ ';
const CIRCLE_RADIUS = 80;
const circlePathD = `M 100,100 m -${CIRCLE_RADIUS},0 a ${CIRCLE_RADIUS},${CIRCLE_RADIUS} 0 1,1 ${CIRCLE_RADIUS * 2},0 a ${CIRCLE_RADIUS},${CIRCLE_RADIUS} 0 1,1 -${CIRCLE_RADIUS * 2},0`;
const circleTextContent = (CIRCLE_TEXT + CIRCLE_TEXT + CIRCLE_TEXT + CIRCLE_TEXT).trim();

function CircularBadge() {
  return (
    <SovereignSparkle active={true}>
      <div className="flex justify-center mb-8 md:mb-12">
        <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full animate-spin-slow"
            style={{ animationDuration: '25s' }}
          >
            <defs>
              <path id="circlePath" d={circlePathD} fill="none" />
            </defs>
            <text
              fill="#C5A059"
              fontSize="11"
              fontWeight="900"
              letterSpacing="0.12em"
              fontFamily="var(--font-ibm-plex), sans-serif"
            >
              <textPath href="#circlePath">{circleTextContent}</textPath>
            </text>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-sovereign-gold/60 blur-[2px] animate-pulse" />
          </div>

          <div className="absolute inset-0 rounded-full border border-sovereign-gold/15" />
          <div className="absolute inset-[2px] rounded-full border border-sovereign-gold/8" />
        </div>
      </div>
    </SovereignSparkle>
  );
}

export function HeroEcosystem() {
  return (
    <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sovereign-gold/8 rounded-full blur-[200px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-16 md:mb-24"
        >
          {/* Circular rotating badge */}
          <motion.div custom={0} variants={fadeUp}>
            <CircularBadge />
          </motion.div>

          {/* STANDARD — sovereign glow */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="relative text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none"
          >
            <span className="absolute inset-0 blur-[40px] bg-sovereign-gold/30 animate-pulse pointer-events-none" aria-hidden="true" />
            <span className="absolute inset-0 blur-[80px] bg-sovereign-gold/15 animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" aria-hidden="true" />
            <span
              className="relative inline-block text-transparent bg-clip-text bg-gradient-to-b from-sovereign-gold-light via-sovereign-gold to-sovereign-gold/70"
              style={{
                textShadow: '0 0 40px rgba(197,160,89,0.4), 0 0 80px rgba(197,160,89,0.15), 0 0 120px rgba(197,160,89,0.05)',
              }}
            >
              STANDARD
            </span>
          </motion.h1>

          {/* Subtitle below logo */}
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-4 md:mt-6 text-sm sm:text-base md:text-lg font-black tracking-[0.2em] uppercase text-sovereign-gold/70"
          >
            حيث تبدأ الجزائر المستقبل.
          </motion.p>

          {/* New description — the manifesto */}
          <motion.div custom={3} variants={fadeUp} className="mt-8 md:mt-10 max-w-3xl mx-auto space-y-3">
            <p className="text-base sm:text-lg md:text-xl text-foreground/90 font-semibold leading-relaxed">
              STANDARD ليست مجرد منصة، بل{' '}
              <span className="text-sovereign-gold">نظام حياة رقمي شامل</span>.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              تجمع الكراء، الخدمات، والتجارة المحلية في تجربة واحدة فائقة الذكاء والأمان.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              من الفخامة إلى البساطة، من التقنية إلى الثقة — كل ما تحتاجه في مكان واحد، في كل أنحاء الجزائر.
            </p>
            <p className="text-sm sm:text-base text-sovereign-gold/60 font-semibold leading-relaxed">
              STANDARD هو المعيار الجديد للسيادة والابتكار في الجزائر.
            </p>
          </motion.div>
        </motion.div>

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
        </motion.div>
      </div>
    </section>
  );
}
