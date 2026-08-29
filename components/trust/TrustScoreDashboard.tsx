'use client';

import { useQuery } from '@tanstack/react-query';
import { reviewsApi, type TrustScore } from '@/lib/api/reviews';
import { motion } from 'framer-motion';
import {
  Shield,
  Star,
  Users,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTrustLevel, type TrustTier } from '@/lib/trust-score';

// ── Tier config — 3-color system (no indigo/blue) ─────────────────────────
const TIER_CONFIG: Record<TrustTier, { label: string; gradient: string; ring: string; icon: string }> = {
  untrusted: {
    label: 'غير موثوق',
    gradient: 'from-red-600 to-red-400',
    ring: 'ring-red-400',
    icon: '🔴',
  },
  beginner: {
    label: 'مبتدئ',
    gradient: 'from-amber-600 to-amber-400',
    ring: 'ring-amber-400',
    icon: '🟡',
  },
  trusted: {
    label: 'موثوق',
    gradient: 'from-emerald-600 to-emerald-400',
    ring: 'ring-emerald-400',
    icon: '🟢',
  },
  highly_trusted: {
    label: 'موثوق بدرجة عالية',
    gradient: 'from-emerald-600 to-emerald-400',
    ring: 'ring-emerald-400',
    icon: '✨',
  },
  fully_trusted: {
    label: 'موثوق تمامًا',
    gradient: 'from-emerald-600 to-emerald-400',
    ring: 'ring-emerald-400',
    icon: '🏆',
  },
};

// ── Component map for score breakdown (verification, rating, vouches) ────────
const COMPONENT_META: Record<
  keyof TrustScore['components'],
  { label: string; icon: React.ElementType; description: string; max: number }
> = {
  verification: {
    label: 'التوثيق (KYC)',
    icon: CheckCircle2,
    description: 'التحقق من الهوية — 30 نقطة عند التحقق الكامل',
    max: 30,
  },
  rating: {
    label: 'تقييمات المجتمع',
    icon: Star,
    description: 'متوسط التقييمات — حتى 25 نقطة عند 5 نجوم',
    max: 25,
  },
  vouches: {
    label: 'تزكيات المجتمع',
    icon: Users,
    description: 'التزكيات المُستلمة — حتى 15 نقطة (5 تزكيات)',
    max: 15,
  },
};

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number; _tier: TrustTier }) {
  const level = getTrustLevel(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  // Gradient color based on tier — no indigo/blue
  const gradientFrom =
    score >= 41 ? '#059669' : score >= 21 ? '#d97706' : '#dc2626';
  const gradientTo =
    score >= 41 ? '#34d399' : score >= 21 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 132 132">
        {/* Track */}
        <circle
          cx="66" cy="66" r={radius}
          fill="none" stroke="currentColor"
          strokeWidth="10"
          className="text-slate-100 dark:text-slate-800"
        />
        {/* Progress */}
        <motion.circle
          cx="66" cy="66" r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#scoreGradient)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <span className={cn('text-4xl font-black', level.color)}>
          {score}
        </span>
        <p className="text-xs text-slate-400 mt-0.5">/100</p>
      </div>
    </div>
  );
}

// ── Component bar ─────────────────────────────────────────────────────────────
function ComponentBar({
  componentKey,
  value,
}: {
  componentKey: keyof TrustScore['components'];
  value: number;
}) {
  const meta = COMPONENT_META[componentKey];
  const Icon = meta.icon;
  const percentage = meta.max > 0 ? (value / meta.max) * 100 : 0;
  const color =
    percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="space-y-1.5" role="listitem">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="font-medium text-slate-700 dark:text-slate-300">{meta.label}</span>
        </div>
        <span
          className={cn(
            'font-bold tabular-nums',
            percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-500' : 'text-red-500'
          )}
          aria-label={`${value} من ${meta.max}`}
        >
          {value}<span className="text-xs text-slate-400 font-normal">/{meta.max}</span>
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={meta.max}
        aria-label={meta.label}
      >
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <p className="text-xs text-slate-400">{meta.description}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TrustScoreDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-trust-score'],
    queryFn: () => reviewsApi.getMyTrustScore(),
    staleTime: 10 * 60 * 1000,
  });

  const score = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError || !score) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-slate-400">
        <Shield className="w-12 h-12 opacity-40" />
        <p className="text-sm">تعذّر تحميل نقاط الثقة. حاول مرة أخرى.</p>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[score.tier];

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4" aria-label="لوحة نقاط الثقة">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-3xl p-8 text-white bg-gradient-to-br shadow-xl relative overflow-hidden',
          tierConfig.gradient
        )}
      >
        {/* BG glow */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Tier badge */}
          <div className={cn('inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold')}>
            <span aria-hidden="true">{tierConfig.icon}</span>
            {score.tier_label}
          </div>

          <ScoreRing score={score.overall_score} _tier={score.tier} />

          <div className="text-center">
            <h2 className="text-xl font-bold">نقاط الثقة الخاصة بك</h2>
            <p className="text-white/70 text-sm mt-1">
              آخر تحديث: اليوم
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tier ladder — 3-color system */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6"
      >
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          المستويات
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(Object.keys(TIER_CONFIG) as TrustTier[]).map((t) => (
            <div
              key={t}
              className={cn(
                'flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                t === score.tier
                  ? cn('text-white bg-gradient-to-br shadow-md', TIER_CONFIG[t].gradient)
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
              )}
              aria-current={t === score.tier ? 'true' : undefined}
            >
              <span aria-hidden="true">{TIER_CONFIG[t].icon}</span>
              {TIER_CONFIG[t].label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Component breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6"
      >
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          تفاصيل المكونات
        </h3>
        <div className="space-y-6" role="list" aria-label="مكونات نقاط الثقة">
          {(Object.entries(score.components) as [keyof TrustScore['components'], number][]).map(
            ([key, value]) => (
              <ComponentBar key={key} componentKey={key} value={value} />
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}