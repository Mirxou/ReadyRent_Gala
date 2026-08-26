'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Repeat, Wrench, Store, ArrowLeft } from 'lucide-react';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';

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
          {/* Animated Ticker Badge */}
          <motion.div custom={0} variants={fadeUp} className="mb-8">
            <SovereignSparkle active={true}>
              <div className="relative overflow-hidden rounded-full border border-sovereign-gold/25 bg-sovereign-gold/8 backdrop-blur-md py-3 px-8 max-w-xl mx-auto">
                <div className="flex animate-marquee whitespace-nowrap">
                  <span className="mx-8 text-sm sm:text-base font-black tracking-[0.15em] text-sovereign-gold">
                    المنصة الأولى في الجزائر
                  </span>
                  <span className="mx-8 text-sm sm:text-base font-black tracking-[0.15em] text-sovereign-gold/40">
                    ✦
                  </span>
                  <span className="mx-8 text-sm sm:text-base font-black tracking-[0.15em] text-sovereign-gold">
                    كراء · خدمات · سوق محلي
                  </span>
                  <span className="mx-8 text-sm sm:text-base font-black tracking-[0.15em] text-sovereign-gold/40">
                    ✦
                  </span>
                  <span className="mx-8 text-sm sm:text-base font-black tracking-[0.15em] text-sovereign-gold">
                    المنصة الأولى في الجزائر
                  </span>
                  <span className="mx-8 text-sm sm:text-base font-black tracking-[0.15em] text-sovereign-gold/40">
                    ✦
                  </span>
                  <span className="mx-8 text-sm sm:text-base font-black tracking-[0.15em] text-sovereign-gold">
                    كراء · خدمات · سوق محلي
                  </span>
                </div>
              </div>
            </SovereignSparkle>
          </motion.div>

          {/* Logo — no trailing dot */}
          <motion.h1 custom={1} variants={fadeUp} className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none">
            <SovereignGlow color="gold" intensity="high">
              <span className="text-sovereign-gold">STANDARD</span>
            </SovereignGlow>
          </motion.h1>

          {/* Main Description — the core value prop */}
          <motion.p custom={2} variants={fadeUp} className="mt-6 md:mt-8 text-lg sm:text-xl md:text-2xl text-foreground/90 font-semibold leading-relaxed max-w-3xl mx-auto">
            منصة واحدة تُتيح لك{' '}
            <span className="text-sovereign-gold">استئجار أي شيء</span>{' '}
            وطلب{' '}
            <span className="text-sovereign-gold">أي خدمة</span>{' '}
            — رقمية أو حقيقية — وتسوّق من{' '}
            <span className="text-sovereign-gold">السوق المحلي</span>
          </motion.p>

          <motion.p custom={3} variants={fadeUp} className="mt-3 text-sm sm:text-base text-muted-foreground font-light max-w-2xl mx-auto">
            كل ما تحتاجه في مكان واحد — في كل أنحاء الجزائر
          </motion.p>
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
