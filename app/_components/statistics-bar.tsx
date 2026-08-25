'use client';

import { motion } from 'framer-motion';
import { Package, Users, Briefcase, Smile } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { useAnimatedCounter } from './animated-counter';
import { formatNumber } from '@/lib/utils';
import type { HomepageStats } from '@/lib/homepage-data';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: typeof Package;
}

function StatItem({ stat, index }: { stat: StatItem; index: number }) {
  const { count, ref } = useAnimatedCounter(stat.value);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.32, 0.72, 0, 1] }}
      className="text-center space-y-2"
    >
      <div className="w-10 h-10 mx-auto rounded-xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold mb-2">
        <stat.icon className="w-5 h-5" />
      </div>
      <p className="text-3xl md:text-4xl font-black tracking-tighter text-sovereign-gold">
        {formatNumber(count)}<span className="text-xl">{stat.suffix}</span>
      </p>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
    </motion.div>
  );
}

export function StatisticsBar({ stats }: { stats: HomepageStats }) {
  const statItems: StatItem[] = [
    { value: stats.total_products, suffix: stats.total_products > 0 ? '+' : '', label: 'منتج', icon: Package },
    { value: stats.total_artisans, suffix: stats.total_artisans > 0 ? '+' : '', label: 'حرفية', icon: Users },
    { value: stats.total_services, suffix: stats.total_services > 0 ? '+' : '', label: 'خدمة', icon: Briefcase },
    { value: stats.total_users, suffix: stats.total_users > 0 ? '+' : '', label: 'عميل سعيد', icon: Smile },
  ];

  return (
    <section className="py-16 md:py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <GlassPanel variant="gold" className="rounded-[2.5rem] p-8 md:p-10">
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {statItems.map((stat, i) => (
                <StatItem key={stat.label} stat={stat} index={i} />
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
