'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, Clock, TrendingUp, Zap } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import { type Plan, fadeUp, staggerContainer, getRenewalDate } from './types';

interface ActiveSubscriptionProps {
  currentPlanId: string;
  plansList: Plan[];
  onUpgrade: () => void;
  onCancel: () => void;
}

export function ActiveSubscription({ currentPlanId, plansList, onUpgrade, onCancel }: ActiveSubscriptionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const currentPlan = plansList.find((p) => p.id === currentPlanId);

  if (!currentPlan) return null;

  return (
    <section ref={ref} className="py-10 md:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-8"
        >
          <motion.p variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">
            الوضع الحالي
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
            اشتراكك <span className="text-sovereign-gold">الحالي</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
        >
          <SovereignGlow color="gold" intensity="high" className="rounded-[2.5rem]">
            <GlassPanel variant="obsidian" className="rounded-[2.5rem] p-6 md:p-10">
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold">
                      <currentPlan.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight">{currentPlan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentPlan.price === 0
                          ? 'خطة مجانية'
                          : `${formatNumber(currentPlan.price)} دج/شهر`}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20 px-4 py-1.5 text-xs font-bold self-start sm:self-center">
                    <Clock className="w-3 h-3 ml-1" />
                    يتجدد {getRenewalDate()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Calendar className="w-4 h-4" /> الحجوزات
                    </div>
                    <div className="text-2xl font-black text-sovereign-gold">
                      {formatNumber(1)}{' '}
                      <span className="text-muted-foreground text-base font-normal">
                        / {currentPlan.bookingsLimit ? formatNumber(currentPlan.bookingsLimit) : '∞'}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sovereign-gold transition-all duration-700"
                        style={{ width: `${currentPlan.bookingsLimit ? Math.min((1 / currentPlan.bookingsLimit) * 100, 100) : 5}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <TrendingUp className="w-4 h-4" /> المميزات النشطة
                    </div>
                    <div className="text-2xl font-black text-sovereign-gold">
                      {formatNumber(currentPlan.features.length)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentPlan.features.slice(0, 3).map((f) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-muted-foreground">{f}</span>
                      ))}
                      {currentPlan.features.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-sovereign-gold/20 text-sovereign-gold/60">
                          +{currentPlan.features.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {currentPlan.id === 'free' ? (
                    <SovereignButton variant="primary" size="sm" className="w-full sm:w-auto" onClick={onUpgrade}>
                      <Zap className="w-4 h-4 ml-2" /> ترقية الاشتراك
                    </SovereignButton>
                  ) : (
                    <>
                      <SovereignButton variant="primary" size="sm" className="w-full sm:w-auto" onClick={onUpgrade}>
                        <TrendingUp className="w-4 h-4 ml-2" /> ترقية الاشتراك
                      </SovereignButton>
                      <SovereignButton variant="danger" size="sm" className="w-full sm:w-auto" onClick={onCancel}>
                        إلغاء الاشتراك
                      </SovereignButton>
                    </>
                  )}
                </div>
              </div>
            </GlassPanel>
          </SovereignGlow>
        </motion.div>
      </div>
    </section>
  );
}
