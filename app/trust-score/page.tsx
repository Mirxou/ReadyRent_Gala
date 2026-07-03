'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Star,
  CreditCard,
  Scale,
  FileCheck,
  IdCard,
  TrendingUp,
  Award,
  Crown,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Hardcoded trust score data
const trustScore = {
  overall: 72,
  tier: 'gold' as const,
  tierLabel: 'ذهبي',
  tierIcon: '🥇',
  tierGradient: 'from-yellow-500 to-amber-400',
  components: [
    { key: 'payment_reliability', label: 'موثوقية الدفع', value: 85, icon: CreditCard, description: 'الالتزام بالمدفوعات وعدم التخلف' },
    { key: 'dispute_history', label: 'سجل النزاعات', value: 60, icon: Scale, description: 'نسبة النزاعات التي حُسمت لصالحك' },
    { key: 'contract_compliance', label: 'التزام العقود', value: 78, icon: FileCheck, description: 'مدى الالتزام بشروط عقود الإيجار' },
    { key: 'review_sentiment', label: 'تقييمات المجتمع', value: 70, icon: Star, description: 'متوسط تقييمات المستخدمين الآخرين' },
    { key: 'identity_verification', label: 'توثيق الهوية', value: 65, icon: IdCard, description: 'اكتمال بيانات KYC والتحقق من الهوية' },
  ],
};

const tiers = [
  { key: 'bronze', label: 'برونزي', icon: '🥉', range: '0-39', gradient: 'from-amber-700 to-amber-500' },
  { key: 'silver', label: 'فضي', icon: '🥈', range: '40-59', gradient: 'from-slate-500 to-slate-300' },
  { key: 'gold', label: 'ذهبي', icon: '🥇', range: '60-79', gradient: 'from-yellow-500 to-amber-400' },
  { key: 'platinum', label: 'بلاتيني', icon: '💎', range: '80-94', gradient: 'from-indigo-500 to-purple-400' },
  { key: 'sovereign', label: 'سيادي', icon: '👑', range: '95-100', gradient: 'from-blue-600 to-cyan-400' },
];

const benefits = [
  { title: 'أسعار أفضل', description: 'حصل على خصومات حصرية على منتجات مختارة', icon: '💰' },
  { title: 'أولوية الحجز', description: 'احجز المنتجات المطلوبة قبل غيرك', icon: '⚡' },
  { title: 'حدود كراء أعلى', description: 'استأجر منتجات أكثر قيمة مع ضمانات مخفضة', icon: '📈' },
  { title: 'ثقة البائعين', description: 'يتم قبول حجوزاتك تلقائياً بدون مراجعة يدوية', icon: '🤝' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] },
  }),
};

export default function TrustScorePage() {
  const circumference = 2 * Math.PI * 72;
  const dashOffset = circumference * (1 - trustScore.overall / 100);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
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

        {/* Score Ring Card */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <div
            className={`rounded-[2.5rem] p-8 md:p-12 text-white bg-gradient-to-br shadow-xl relative overflow-hidden ${trustScore.tierGradient}`}
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              {/* Tier badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold">
                <span>{trustScore.tierIcon}</span>
                المستوى {trustScore.tierLabel}
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
                    {trustScore.overall}
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
        </motion.div>

        {/* Tier Ladder */}
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
              <Award className="w-4 h-4" />
              المستويات
            </h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {tiers.map((t) => (
                <div
                  key={t.key}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    t.key === trustScore.tier
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
          <GlassPanel
            className="p-6 md:p-8 rounded-[2rem]"
            variant="obsidian"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              تفاصيل المكونات
            </h3>
            <div className="space-y-6">
              {trustScore.components.map((comp) => {
                const Icon = comp.icon;
                const color =
                  comp.value >= 80
                    ? 'bg-emerald-500'
                    : comp.value >= 50
                    ? 'bg-amber-400'
                    : 'bg-red-400';
                const textColor =
                  comp.value >= 80
                    ? 'text-emerald-500'
                    : comp.value >= 50
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
                        {comp.value}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${comp.value}%` }}
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
                'أكمل التحقق من الهوية للحصول على نقاط إضافية',
                'التزم بمواعيد الإرجاع في كل حجوزاتك',
                'احصل على تقييمات إيجابية من المستأجرين والبائعين',
                'تجنب فتح نزاعات غير ضرورية',
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