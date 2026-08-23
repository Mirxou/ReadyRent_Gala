'use client';

import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import { type Plan } from './types';

interface PlanCardProps {
  plan: Plan;
  index: number;
  isCurrent: boolean;
  onSubscribe: () => void;
  inView: boolean;
}

export function PlanCard({ plan, index, isCurrent, onSubscribe, inView }: PlanCardProps) {
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
      className="flex"
    >
      <div
        className={`relative w-full rounded-[2rem] border p-6 md:p-8 flex flex-col transition-all duration-500 ${
          plan.popular
            ? 'border-sovereign-gold/40 bg-sovereign-gold/5 shadow-[0_0_40px_rgba(197,160,89,0.1)]'
            : 'border-white/5 bg-white/[0.02] hover:border-sovereign-gold/20 hover:bg-sovereign-gold/[0.02]'
        } ${isCurrent ? 'ring-2 ring-sovereign-gold/30' : ''}`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-sovereign-gold text-sovereign-black border-0 px-4 py-1 text-[10px] font-black tracking-[0.2em] shadow-lg shadow-sovereign-gold/20">
              <Star className="w-3 h-3 ml-1" /> الأكثر شعبية
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            plan.popular ? 'bg-sovereign-gold/20 text-sovereign-gold' : 'bg-white/5 text-muted-foreground'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          <div><h3 className="text-xl font-black tracking-tight">{plan.name}</h3></div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-black tracking-tight text-sovereign-gold">
              {plan.price === 0 ? 'مجاني' : `${formatNumber(plan.price)}`}
            </span>
            {plan.price > 0 && <span className="text-sm text-muted-foreground">دج/شهر</span>}
          </div>
        </div>

        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-sovereign-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-sovereign-gold" />
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          {isCurrent ? (
            <SovereignButton variant="obsidian" size="sm" className="w-full" disabled>الخطة الحالية</SovereignButton>
          ) : (
            <SovereignButton variant={plan.popular ? 'primary' : 'secondary'} size="sm" className="w-full" onClick={onSubscribe}>
              <Zap className="w-4 h-4 ml-2" /> اشترك الآن
            </SovereignButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}
