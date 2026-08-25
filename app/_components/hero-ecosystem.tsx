'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Shirt, Sparkles, Store, ArrowLeft } from 'lucide-react';
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
