"use client";

import Link from 'next/link';
import { motion, useScroll, useTransform } from "framer-motion";
import { SovereignButton } from "@/components/sovereign/sovereign-button";
import { GlassPanel } from "@/components/sovereign/glass-panel";
import { IdentityShield } from "@/components/sovereign/identity-shield";
import { ShieldCheck, LockKeyhole, FileSignature, ArrowLeft } from 'lucide-react';
import { FeaturedProducts } from '@/components/product/featured-products';

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">

      {/* SECTION 1: THE SOVEREIGN GATE (Hero) */}
      <section className="h-screen w-full relative flex flex-col justify-center items-center">

        {/* Abstract Background (Quiet Authority) */}
        <div className="absolute inset-0 z-0 bg-background">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-sovereign-blue/5 to-transparent dark:from-sovereign-gold/5" />
        </div>

        {/* Content */}
        <motion.div
          style={{ opacity, scale }}
          className="z-20 text-center max-w-4xl px-6 flex flex-col items-center"
        >
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="px-4 py-1 rounded-full border border-sovereign-gold/30 bg-sovereign-gold/5 text-sovereign-gold text-xs font-bold tracking-[0.2em] uppercase">
              The Algerian Standard
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-9xl font-black tracking-tighter text-foreground mb-6"
          >
            STANDARD<span className="text-sovereign-gold">.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl md:text-2xl text-muted-foreground font-light mb-12 tracking-wide"
          >
            السيادة. الفخامة. الثقة المطلقة.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col md:flex-row gap-6 items-center relative"
          >
            {/* New AI Search Badge Hint */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, type: 'spring' }}
              className="absolute -top-12 md:-right-12 md:top-auto"
            >
              <Link href="/ai-search" className="group">
                <div className="bg-gala-purple/10 backdrop-blur-md border border-gala-purple/30 px-3 py-1 rounded-full text-[10px] font-bold text-gala-purple flex items-center gap-2 hover:bg-gala-purple/20 transition-all cursor-pointer">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gala-purple opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gala-purple"></span>
                  </span>
                  بحث بمعايير الثقة AI
                </div>
              </Link>
            </motion.div>

            <Link href="/products">
              <SovereignButton size="xl" variant="primary" withShimmer>
                تصفح المجموعة
              </SovereignButton>
            </Link>

            <Link href="/register">
              <SovereignButton size="lg" variant="secondary">
                انضم إلى النخبة
              </SovereignButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 text-sovereign-gold/50 animate-pulse"
        >
          <div className="h-16 w-[1px] bg-gradient-to-b from-transparent via-sovereign-gold to-transparent mx-auto" />
        </motion.div>
      </section>


      {/* SECTION 2: THE CONSTITUTION (Pillars) */}
      <section className="py-32 px-6 relative z-10 bg-gradient-to-b from-background to-sovereign-blue/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 text-center">
            <h2 className="text-3xl font-bold text-sovereign-blue dark:text-sovereign-white mb-4">دستور STANDARD</h2>
            <div className="h-1 w-24 bg-sovereign-gold mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <GlassPanel className="p-10 flex flex-col items-center text-center gap-6 group hover:border-sovereign-gold/50 transition-colors duration-500">
              <div className="p-4 rounded-full bg-sovereign-blue/5 text-sovereign-blue dark:text-sovereign-gold dark:bg-sovereign-gold/10">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">الهوية السيادية</h3>
              <p className="text-muted-foreground leading-relaxed">
                نظام تحقق صارم يضمن أن كل عضو هو "سيد" موثوق. شارتك الذهبية هي جواز مرورك.
              </p>
              <div className="mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <IdentityShield status="verified" showLabel={false} />
              </div>
            </GlassPanel>

            {/* Pillar 2 */}
            <GlassPanel className="p-10 flex flex-col items-center text-center gap-6 group hover:border-sovereign-gold/50 transition-colors duration-500">
              <div className="p-4 rounded-full bg-sovereign-blue/5 text-sovereign-blue dark:text-sovereign-gold dark:bg-sovereign-gold/10">
                <LockKeyhole className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">تجميد القيمة</h3>
              <p className="text-muted-foreground leading-relaxed">
                عند الحجز، نجمد السعر والزمن. لا مفاجآت، لا مزايدات. كلمتك هي العقد.
              </p>
            </GlassPanel>

            {/* Pillar 3 */}
            <GlassPanel className="p-10 flex flex-col items-center text-center gap-6 group hover:border-sovereign-gold/50 transition-colors duration-500">
              <div className="p-4 rounded-full bg-sovereign-blue/5 text-sovereign-blue dark:text-sovereign-gold dark:bg-sovereign-gold/10">
                <FileSignature className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">العقد الذكي</h3>
              <p className="text-muted-foreground leading-relaxed">
                كل معاملة محمية بعقد رقمي ملزم. حقوق المالك والمستأجر محفوظة بقوة القانون.
              </p>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* SECTION 2.5: LIVE PRODUCTS CHECK */}
      <FeaturedProducts />

      {/* SECTION 3: THE CALL (CTA) */}
      <section className="py-40 px-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[120px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-foreground tracking-tight">
            ارتقِ بمعاييرك.
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            أنت لا تستأجر سيارة أو فستاناً. أنت تدخل عالماً لا يقبل إلا الأفضل.
          </p>

          <Link href="/products">
            <SovereignButton size="xl" variant="primary" className="shadow-2xl shadow-sovereign-gold/20">
              <span className="flex items-center gap-4">
                ابدأ الرحلة <ArrowLeft className="w-6 h-6" />
              </span>
            </SovereignButton>
          </Link>
        </div>
      </section>

    </div>
  );
}
