"use client";

import Link from 'next/link';
import { InteractiveProductCard } from "@/components/ui/interactive-product-card";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { TiltCard } from "@/components/ui/tilt-card";
import { ParticleField } from "@/components/ui/particle-field";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Sparkles, Zap, Star } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const [ref1, inView1] = useInView({ threshold: 0.3, triggerOnce: true });
  const [ref2, inView2] = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Particle Background */}
      <ParticleField />

      {/* SECTION 1: VIBRANT HERO */}
      <section className="h-screen w-full relative flex flex-col justify-center items-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 bg-gradient-animated" />

        {/* Radial Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gala-purple/30 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gala-pink/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content Layer */}
        <motion.div
          style={{ opacity, scale }}
          className="z-20 text-center max-w-5xl px-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20"
          >
            <Sparkles className="w-5 h-5 text-gala-gold animate-pulse" />
            <span className="text-gray-900 dark:text-white/90 font-medium drop-shadow-lg">مجموعة 2026 الحصرية</span>
          </motion.div>

          <motion.h1
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-mega mb-6 animate-float"
          >
            READY RENT
          </motion.h1>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center gap-8"
          >
            <p className="text-2xl md:text-4xl text-foreground dark:text-white/90 font-light tracking-widest">
              أناقة لا تُنسى • تجربة استثنائية
            </p>

            <div className="flex gap-4 mt-8">
              <MagneticButton variant="primary" withConfetti>
                <Link href="/products" className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  استكشف المجموعة
                </Link>
              </MagneticButton>

              <MagneticButton variant="outline">
                <Link href="/about">تعرف علينا</Link>
              </MagneticButton>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 text-foreground dark:text-white/70 animate-bounce"
        >
          <ArrowDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* SECTION 2: FEATURES WITH CARDS */}
      <section
        ref={ref1}
        className="py-32 px-6 md:px-12 max-w-7xl mx-auto relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent">
            لماذا ReadyRent؟
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            تجربة فريدة تجمع بين الأناقة والابتكار
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Star className="w-12 h-12 text-gala-gold" />,
              title: "تشكيلة حصرية",
              description: "فساتين مختارة بعناية من أرقى المصممين"
            },
            {
              icon: <Zap className="w-12 h-12 text-gala-purple" />,
              title: "تجربة سلسة",
              description: "حجز سريع وتوصيل في نفس اليوم"
            },
            {
              icon: <Sparkles className="w-12 h-12 text-gala-pink" />,
              title: "أسعار مناسبة",
              description: "أناقة فاخرة بأسعار معقولة"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={inView1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <TiltCard className="h-full">
                <div className="p-8 h-full flex flex-col items-center text-center gap-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-gala-purple/20 to-gala-pink/20 glow-purple">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 3: PRODUCTS SHOWCASE */}
      <section
        ref={ref2}
        className="py-32 px-6 md:px-12 bg-gradient-to-b from-background to-gala-purple/5 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gala-cyan via-gala-purple to-gala-pink bg-clip-text text-transparent">
                مختارات الموسم
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              اكتشف أحدث إضافاتنا
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView2 ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: item * 0.15 }}
              >
                <InteractiveProductCard
                  product={{
                    id: item,
                    name_ar: `فستان سهرة فاخر ${item}`,
                    price_per_day: 15000,
                    primary_image: `https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&auto=format&fit=crop`,
                    category: { name_ar: "فساتين" },
                    is_featured: true
                  }}
                />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <MagneticButton variant="secondary" withConfetti>
              <Link href="/products" className="flex items-center gap-2">
                عرض جميع المنتجات
                <ArrowDown className="w-5 h-5 rotate-[-90deg]" />
              </Link>
            </MagneticButton>
          </div>
        </motion.div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="py-32 px-6 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-animated opacity-20" />
        <div className="absolute inset-0 glow-purple" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-mega">
            جاهز للتألق؟
          </h2>
          <p className="text-2xl text-muted-foreground mb-12">
            ابدأ رحلتك نحو الأناقة الاستثنائية اليوم
          </p>
          <MagneticButton variant="primary" withConfetti className="text-xl px-12 py-6">
            <Link href="/register">ابدأ الآن</Link>
          </MagneticButton>
        </motion.div>
      </section>
    </div>
  );
}
