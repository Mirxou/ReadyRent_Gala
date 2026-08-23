'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { type Plan, fadeUp, staggerContainer } from './types';
import { PlanCard } from './plan-card';

interface PlansSectionProps {
  currentPlanId: string;
  plansList: Plan[];
  onSelectPlan: (plan: Plan) => void;
}

export function PlansSection({ currentPlanId, plansList, onSelectPlan }: PlansSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-10 md:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={staggerContainer} className="mb-10">
          <motion.p variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">
            الخطط المتاحة
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
            اختر <span className="text-sovereign-gold">خطتك</span>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {plansList.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              isCurrent={plan.id === currentPlanId}
              onSubscribe={() => onSelectPlan(plan)}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
