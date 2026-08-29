'use client';

import { motion, type Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Star,
  CheckCircle2,
  Users,
  TrendingUp,
  Crown,
  ArrowLeft,
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { type TrustTier } from '@/lib/trust-score';

/* ────────────────────────────────────────────
   Types — matches new API response format
   ──────────────────────────────────────────── */
interface TrustScoreApiResponse {
  overall_score: number;
  is_verified: boolean;
  vouch_count: number;
  review_count: number;
  avg_rating: number;
  components: {
    verification: number;
    rating: number;
    vouches: number;
  };
  tier: TrustTier;
  tier_label: string;
}

interface TrustComponent {
  key: string;
  label: string;
  value: number;
  max: number;
  icon: React.ElementType;
  description: string;
}

/* ────────────────────────────────────────────
   3-Color Tier System (MVP spec)
   ──────────────────────────────────────────── */
const TIERS: { key: TrustTier; label: string; icon: string; range: string; gradient: string }[] = [
  { key: 'untrusted', label: 'غير موثوق', icon: '🔴', range: '0-20', gradient: 'from-red-600 to-red-400' },
  { key: 'beginner', label: 'مبتدئ', icon: '🟡', range: '21-40', gradient: 'from-amber-600 to-amber-400' },
  { key: 'trusted', label: 'موثوق', icon: '🟢', range: '41-60', gradient: 'from-emerald-600 to-emerald-400' },
  { key: 'highly_trusted', label: 'موثوق بدرجة عالية', icon: '✨', range: '61-80', gradient: 'from-emerald-600 to-emerald-400' },
  { key: 'fully_trusted', label: 'موثوق تمامًا', icon: '🏆', range: '81-100', gradient: 'from-emerald-600 to-emerald-400' },
];

/* ────────────────────────────────────────────
   Component breakdown (3 components: verification, rating, vouches)
   ──────────────────────────────────────────── */
function buildComponents(components?: TrustScoreApiResponse['components']): TrustComponent[] {
  return [
    { key: 'verification', label: 'التوثيق (KYC)', value: components?.verification ?? 0, max: 30, icon: CheckCircle2, description: 'التحقق من الهوية — 30 نقطة عند التحقق الكامل' },
    { key: 'rating', label: 'تقييمات المجتمع', value: components?.rating ?? 0, max: 25, icon: Star, description: 'متوسط التقييمات — حتى 25 نقطة عند 5 نجوم' },
    { key: 'vouches', label: 'تزكيات المجتمع', value: components?.vouches ?? 0, max: 15, icon: Users, description: 'التزكيات المُستلمة — حتى 15 نقطة (5 تزكيات)' },
  ];
}

const benefits = [
  { title: 'أسعار أفضل', description: 'حصل على خصومات حصرية على منتجات مختارة', icon: '💰' },
  { title: 'أولوية الحجز', description: 'احجز المنتجات المطلوبة قبل غيرك', icon: '⚡' },
  { title: 'حدود كراء أعلى', description: 'استأجر منتجات أكثر قيمة مع ضمانات مخفضة', icon: '📈' },
  { title: 'ثقة البائعين', description: 'يتم قبول حجوزاتك تلقائياً بدون مراجعة يدوية', icon: '🤝' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] },
  }),
};

/* ────────────────────────────────────────────
   Loading Skeleton
   ──────────────────────────────────────────── */
function ScoreRingSkeleton() {
  return (
    <div className="rounded-[2.5rem] p-8 md:p-12 text-white bg-gradient-to-br from-amber-600 to-amber-400 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <Skeleton className="h-7 w-36 rounded-full bg-white/20" />
        <Skeleton className="w-44 h-44 rounded-full bg-white/20" />
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-48 bg-white/20 mx-auto" />
          <Skeleton className="h-4 w-28 bg-white/20 mx-auto" />
        </div>
      </div>
    </div>
  );
}

function ComponentsSkeleton() {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 md:p-8 space-y-6">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

export default function TrustScorePage() {
  const { isAuthenticated } = useAuthStore();

  // Fetch trust score from API
  const { data, isLoading, isError } = useQuery<TrustScoreApiResponse>({
    queryKey: ['trust-score-me'],
    queryFn: () =>
      fetch('/api/social/score/me/')
        .then((r) => r.json())
        .then((d) => d.data),
    enabled: isAuthenticated,
  });

  const overall = data?.overall_score ?? 0;
  const components = buildComponents(data?.components);

  // Determine score ring gradient based on trust level
  const ringGradient =
    overall >= 41
      ? 'from-emerald-600 to-emerald-400'
      : overall >= 21
        ? 'from-amber-600 to-amber-400'
        : 'from-red-600 to-red-400';

  const circumference = 2 * Math.PI * 72;
  const dashOffset = circumference * (1 - overall / 100);

  // Find current tier info
  const currentTier = TIERS.find((t) => t.key === data?.tier) ?? TIERS[0];

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        {/* Not logged in state */}
        {!isAuthenticated && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full py-2 px-6 text-sm font-bold mb-6">
              <Shield className="w-4 h-4" />
              يرجى تسجيل الدخول لعرض نقاط ثقتك
            </div>
            <p className="text-muted-foreground mb-6">قم بتسجيل الدخول للاطلاع على نقاط الثقة الخاصة بك والمزايا المتاحة.</p>
            <Button asChild className="rounded-full bg-sovereign-gold text-black hover:bg-sovereign-gold/90">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
          </div>
        )}

        {/* Hero */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 bg-sovereign-gold/10 text-sovereign-gold border border-sovereign-gold/30 rounded-full py-1 px-4 text-xs font-bold mb-6">
              <Shield className="w-4 h-4" />
              نظام سمعة موثوق
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-6xl font-black mb-4"
          >
            نقاط <span className="text-sovereign-gold">الثقة</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            نقاط الثقة تعكس سمعتك وموثوقيتك على المنصة. كلما ارتفعت نقاطك، حصلت على
            مزايا حصرية وفرص أفضل.
          </motion.p>
        </motion.div>

        {/* Error State */}
        {isError && (
          <div className="text-center mb-12">
            <p className="text-red-400 text-sm">تعذر تحميل نقاط الثقة. يرجى المحاولة لاحقاً.</p>
          </div>
        )}

        {/* Score Ring Card */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          {isLoading ? (
            <ScoreRingSkeleton />
          ) : (
            <div
              className={`rounded-[2.5rem] p-8 md:p-12 text-white bg-gradient-to-br shadow-xl relative overflow-hidden ${ringGradient}`}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white" />

              <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Tier badge */}
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold">
                  <span>{currentTier.icon}</span>
                  {data?.tier_label ?? currentTier.label}
                </div>

                {/* Score Ring */}
                <div className="relative flex items-center justify-center w-44 h-44 mx-auto">
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 160 160"
                  >
                    <circle
                      cx="80" cy="80" r={72}
                      fill="none" stroke="currentColor"
                      strokeWidth="10"
                      className="text-white/20"
                    />
                    <motion.circle
                      cx="80" cy="80" r={72}
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      stroke="white"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 1.4, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="text-center z-10">
                    <span className="text-5xl font-black">
                      {overall}
                    </span>
                    <p className="text-xs text-white/60 mt-1">/100</p>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold">نقاط الثقة الخاصة بك</h2>
                  <p className="text-white/70 text-sm mt-1">
                    آخر تحديث: اليوم
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tier Ladder — 3-color system */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={1}
          className="mb-12"
        >
          <GlassPanel
            className="p-6 rounded-[2rem]"
            variant="obsidian"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              المستويات
            </h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {TIERS.map((t) => (
                <div
                  key={t.key}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    t.key === data?.tier
                      ? `text-white bg-gradient-to-br shadow-md ${t.gradient}`
                      : 'bg-white/5 text-muted-foreground'
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                  <span className="text-[10px] opacity-60">({t.range})</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        {/* Component Breakdown */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={2}
          className="mb-12"
        >
          {isLoading ? (
            <ComponentsSkeleton />
          ) : (
            <GlassPanel
              className="p-6 md:p-8 rounded-[2rem]"
              variant="obsidian"
            >
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                تفاصيل المكونات
              </h3>
              <div className="space-y-6">
                {components.map((comp) => {
                  const Icon = comp.icon;
                  const percentage = comp.max > 0 ? (comp.value / comp.max) * 100 : 0;
                  const color =
                    percentage >= 80
                      ? 'bg-emerald-500'
                      : percentage >= 50
                        ? 'bg-amber-400'
                        : 'bg-red-400';
                  const textColor =
                    percentage >= 80
                      ? 'text-emerald-500'
                      : percentage >= 50
                        ? 'text-amber-400'
                        : 'text-red-400';

                  return (
                    <div key={comp.key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{comp.label}</span>
                        </div>
                        <span className={`font-bold tabular-nums ${textColor}`}>
                          {comp.value}<span className="text-xs text-muted-foreground font-normal">/{comp.max}</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{comp.description}</p>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          )}
        </motion.div>

        {/* Benefits of High Trust Score */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl md:text-4xl font-black text-center mb-12"
          >
            مزايا نقاط الثقة <span className="text-sovereign-gold">العالية</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={fadeUp}
                custom={index + 1}
              >
                <GlassPanel
                  className="p-6 rounded-[2rem] h-full flex gap-4 items-start"
                  variant="obsidian"
                >
                  <div className="text-3xl">{benefit.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tips to improve */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <GlassPanel
            className="p-8 md:p-10 rounded-[2.5rem]"
            variant="obsidian"
            gradientBorder
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-sovereign-gold" />
              نصائح لرفع نقاط ثقتك
            </h3>
            <div className="space-y-4">
              {[
                'أكمل التحقق من الهوية للحصول على +30 نقطة',
                'حصل على تقييمات إيجابية من المستأجرين والبائعين',
                'اطلب تزكيات من المستخدمين الموثوقين في المجتمع',
                'التزم بمواعيد الإرجاع في كل حجوزاتك',
                'استخدم منصة الدفع الموثوقة لجميع المعاملات',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sovereign-gold mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="text-center"
        >
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}