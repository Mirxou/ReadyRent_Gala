'use client';

import { useState, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { toast } from 'sonner';
import {
  Crown,
  Check,
  Star,
  Shield,
  Zap,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatNumber } from '@/lib/utils';

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */
interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
  bookingsLimit: number | null;
}

interface SubscriptionHistory {
  id: string;
  date: string;
  plan: string;
  amount: number;
  status: 'مدفوع' | 'نشط' | 'ملغي';
}

/* ────────────────────────────────────────────
   Data
   ──────────────────────────────────────────── */
const plans: Plan[] = [
  {
    id: 'free',
    name: 'مجاني',
    price: 0,
    bookingsLimit: 3,
    icon: Shield,
    features: [
      'تصفح المنتجات',
      '3 حجوزات شهرياً',
      'دعم بالبريد',
    ],
  },
  {
    id: 'basic',
    name: 'أساسي',
    price: 1500,
    bookingsLimit: 10,
    icon: Star,
    features: [
      '10 حجوزات شهرياً',
      'تأمين أساسي مجاني',
      'دعم هاتفي',
      'شارة "عضو أساسي"',
    ],
  },
  {
    id: 'premium',
    name: 'مميز',
    price: 4500,
    bookingsLimit: null,
    icon: Crown,
    popular: true,
    features: [
      'حجوزات غير محدودة',
      'تأمين متقدم مجاني',
      'أولوية في العروض',
      'خصم 10%',
      'شارة "عضو مميز"',
      'مستشار شخصي',
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 9900,
    bookingsLimit: null,
    icon: Sparkles,
    features: [
      'كل مميزات Premium',
      'توصيل مجاني',
      'دخول مبكر للعروض',
      'نقاط ثقة مضاعفة',
      'شارة VIP ذهبية',
      'دعم على مدار الساعة',
    ],
  },
];

const initialHistory: SubscriptionHistory[] = [
  {
    id: 'INV-2026-001',
    date: '2026-05-01',
    plan: 'مجاني',
    amount: 0,
    status: 'مدفوع',
  },
  {
    id: 'INV-2026-002',
    date: '2026-04-01',
    plan: 'أساسي',
    amount: 1500,
    status: 'مدفوع',
  },
  {
    id: 'INV-2026-003',
    date: '2026-03-01',
    plan: 'أساسي',
    amount: 1500,
    status: 'ملغي',
  },
];

/* ────────────────────────────────────────────
   Animation Variants
   ──────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.12,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ────────────────────────────────────────────
   Helper: get renewal date (30 days from now)
   ──────────────────────────────────────────── */
function getRenewalDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ════════════════════════════════════════════
   SECTION 1 — ACTIVE SUBSCRIPTION
   ════════════════════════════════════════════ */
function ActiveSubscription({
  currentPlanId,
  plansList,
  onUpgrade,
  onCancel,
}: {
  currentPlanId: string;
  plansList: Plan[];
  onUpgrade: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const currentPlan = plansList.find((p) => p.id === currentPlanId)!;

  return (
    <section ref={ref} className="py-10 md:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-8"
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3"
          >
            الوضع الحالي
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter"
          >
            اشتراكك <span className="text-sovereign-gold">الحالي</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
        >
          <SovereignGlow color="gold" intensity="high" className="rounded-[2.5rem]">
            <GlassPanel
              variant="obsidian"
              className="rounded-[2.5rem] p-6 md:p-10"
            >
              <div className="relative z-10">
                {/* Top row: plan name + badge */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold">
                      <currentPlan.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                        {currentPlan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentPlan.price === 0
                          ? 'خطة مجانية'
                          : `${formatNumber(currentPlan.price)} دج/شهر`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20 px-4 py-1.5 text-xs font-bold self-start sm:self-center"
                  >
                    <Clock className="w-3 h-3 ml-1" />
                    يتجدد {getRenewalDate()}
                  </Badge>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Calendar className="w-4 h-4" />
                      الحجوزات
                    </div>
                    <div className="text-2xl font-black text-sovereign-gold">
                      {formatNumber(1)}{' '}
                      <span className="text-muted-foreground text-base font-normal">
                        /{' '}
                        {currentPlan.bookingsLimit
                          ? formatNumber(currentPlan.bookingsLimit)
                          : '∞'}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sovereign-gold transition-all duration-700"
                        style={{
                          width: `${
                            currentPlan.bookingsLimit
                              ? Math.min((1 / currentPlan.bookingsLimit) * 100, 100)
                              : 5
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <TrendingUp className="w-4 h-4" />
                      المميزات النشطة
                    </div>
                    <div className="text-2xl font-black text-sovereign-gold">
                      {formatNumber(currentPlan.features.length)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {currentPlan.features.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-muted-foreground"
                        >
                          {f}
                        </span>
                      ))}
                      {currentPlan.features.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-sovereign-gold/20 text-sovereign-gold/60">
                          +{currentPlan.features.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {currentPlan.id === 'free' ? (
                    <SovereignButton
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={onUpgrade}
                    >
                      <Zap className="w-4 h-4 ml-2" />
                      ترقية الاشتراك
                    </SovereignButton>
                  ) : (
                    <>
                      <SovereignButton
                        variant="primary"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={onUpgrade}
                      >
                        <TrendingUp className="w-4 h-4 ml-2" />
                        ترقية الاشتراك
                      </SovereignButton>
                      <SovereignButton
                        variant="danger"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={onCancel}
                      >
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

/* ════════════════════════════════════════════
   SECTION 2 — PLAN CARD
   ════════════════════════════════════════════ */
function PlanCard({
  plan,
  index,
  isCurrent,
  onSubscribe,
  inView,
}: {
  plan: Plan;
  index: number;
  isCurrent: boolean;
  onSubscribe: () => void;
  inView: boolean;
}) {
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.12,
        ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
      }}
      className="flex"
    >
      <div
        className={`relative w-full rounded-[2rem] border p-6 md:p-8 flex flex-col transition-all duration-500 ${
          plan.popular
            ? 'border-sovereign-gold/40 bg-sovereign-gold/5 shadow-[0_0_40px_rgba(197,160,89,0.1)]'
            : 'border-white/5 bg-white/[0.02] hover:border-sovereign-gold/20 hover:bg-sovereign-gold/[0.02]'
        } ${isCurrent ? 'ring-2 ring-sovereign-gold/30' : ''}`}
      >
        {/* Popular badge */}
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-sovereign-gold text-sovereign-black border-0 px-4 py-1 text-[10px] font-black tracking-[0.2em] shadow-lg shadow-sovereign-gold/20">
              <Star className="w-3 h-3 ml-1" />
              الأكثر شعبية
            </Badge>
          </div>
        )}

        {/* Plan icon + name */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              plan.popular
                ? 'bg-sovereign-gold/20 text-sovereign-gold'
                : 'bg-white/5 text-muted-foreground'
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-black tracking-tight text-sovereign-gold">
              {plan.price === 0 ? 'مجاني' : `${formatNumber(plan.price)}`}
            </span>
            {plan.price > 0 && (
              <span className="text-sm text-muted-foreground">دج/شهر</span>
            )}
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-sovereign-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-sovereign-gold" />
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <div className="mt-auto">
          {isCurrent ? (
            <SovereignButton
              variant="obsidian"
              size="sm"
              className="w-full"
              disabled
            >
              الخطة الحالية
            </SovereignButton>
          ) : (
            <SovereignButton
              variant={plan.popular ? 'primary' : 'secondary'}
              size="sm"
              className="w-full"
              onClick={onSubscribe}
            >
              <Zap className="w-4 h-4 ml-2" />
              اشترك الآن
            </SovereignButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   SECTION 3 — SUBSCRIPTION PLANS GRID
   ════════════════════════════════════════════ */
function PlansSection({
  currentPlanId,
  onSelectPlan,
}: {
  currentPlanId: string;
  onSelectPlan: (plan: Plan) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-10 md:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-10"
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3"
          >
            الخطط المتاحة
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter"
          >
            اختر <span className="text-sovereign-gold">خطتك</span>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {plans.map((plan, i) => (
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

/* ════════════════════════════════════════════
   SECTION 4 — SUBSCRIPTION HISTORY
   ════════════════════════════════════════════ */
function HistorySection({ history }: { history: SubscriptionHistory[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const statusStyles: Record<string, string> = {
    مدفوع: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    نشط: 'bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20',
    ملغي: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <section ref={ref} className="py-10 md:py-16 px-4 pb-24 md:pb-32">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-8"
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3"
          >
            السجل
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter"
          >
            سجل <span className="text-sovereign-gold">المدفوعات</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
        >
          <GlassPanel
            variant="obsidian"
            className="rounded-[2rem] p-4 md:p-6"
          >
            <div className="relative z-10">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-right py-4 px-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        التاريخ
                      </th>
                      <th className="text-right py-4 px-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        الخطة
                      </th>
                      <th className="text-right py-4 px-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        المبلغ
                      </th>
                      <th className="text-right py-4 px-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        الحالة
                      </th>
                      <th className="text-right py-4 px-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        الفاتورة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry, i) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                          duration: 0.5,
                          delay: i * 0.1,
                          ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
                        }}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-3 text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString('ar-DZ', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-3 font-bold">{entry.plan}</td>
                        <td className="py-4 px-3 text-sovereign-gold font-bold">
                          {entry.amount === 0
                            ? 'مجاني'
                            : `${formatNumber(entry.amount)} دج`}
                        </td>
                        <td className="py-4 px-3">
                          <Badge
                            className={`${statusStyles[entry.status]} border text-[10px] font-bold px-2.5 py-0.5`}
                          >
                            {entry.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-3">
                          <button className="flex items-center gap-1.5 text-sovereign-gold/60 hover:text-sovereign-gold transition-colors text-xs font-bold">
                            <FileText className="w-3.5 h-3.5" />
                            عرض
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden max-h-96 overflow-y-auto space-y-3 scrollbar-thin">
                {history.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.1,
                      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
                    }}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold">{entry.plan}</span>
                      <Badge
                        className={`${statusStyles[entry.status]} border text-[10px] font-bold px-2.5 py-0.5`}
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {new Date(entry.date).toLocaleDateString('ar-DZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-sovereign-gold font-bold">
                        {entry.amount === 0
                          ? 'مجاني'
                          : `${formatNumber(entry.amount)} دج`}
                      </span>
                    </div>
                    <button className="mt-3 flex items-center gap-1.5 text-sovereign-gold/60 hover:text-sovereign-gold transition-colors text-xs font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      عرض الفاتورة
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════
   CONFIRMATION DIALOG
   ════════════════════════════════════════════ */
function ConfirmationDialog({
  plan,
  open,
  onOpenChange,
  onConfirm,
  isProcessing,
}: {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  if (!plan) return null;
  const Icon = plan.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sovereign-obsidian border-sovereign-gold/20 text-sovereign-white rounded-[2rem] p-6 md:p-8 max-w-[calc(100%-2rem)] sm:max-w-lg backdrop-blur-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold">
            <Icon className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-center text-sovereign-white">
            تأكيد الاشتراك
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Summary */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">الخطة</span>
              <span className="font-bold">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">السعر الشهري</span>
              <span className="font-bold text-sovereign-gold">
                {plan.price === 0
                  ? 'مجاني'
                  : `${formatNumber(plan.price)} دج`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">دورة الفوترة</span>
              <span className="font-bold">شهري</span>
            </div>
            <div className="border-t border-white/5 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold">المبلغ الإجمالي</span>
              <span className="text-xl font-black text-sovereign-gold">
                {plan.price === 0
                  ? 'مجاني'
                  : `${formatNumber(plan.price)} دج`}
              </span>
            </div>
          </div>

          {/* Features preview */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {plan.features.slice(0, 4).map((f) => (
              <span
                key={f}
                className="text-[10px] px-2.5 py-1 rounded-full border border-sovereign-gold/15 text-sovereign-gold/70 bg-sovereign-gold/5"
              >
                {f}
              </span>
            ))}
            {plan.features.length > 4 && (
              <span className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground">
                +{plan.features.length - 4} أخرى
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <SovereignButton
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={onConfirm}
              isLoading={isProcessing}
            >
              تأكيد الاشتراك
            </SovereignButton>
            <SovereignButton
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              إلغاء
            </SovereignButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ════════════════════════════════════════════
   PAGE — SUBSCRIPTIONS
   ════════════════════════════════════════════ */
export default function SubscriptionsPage() {
  const [currentPlanId, setCurrentPlanId] = useState('free');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<SubscriptionHistory[]>(initialHistory);

  // Scroll to plans section on upgrade
  const plansRef = useRef<HTMLDivElement>(null);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update current plan
    setCurrentPlanId(selectedPlan.id);

    // Add to history
    const newEntry: SubscriptionHistory = {
      id: `INV-2026-${String(history.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      plan: selectedPlan.name,
      amount: selectedPlan.price,
      status: 'نشط',
    };
    setHistory((prev) => [newEntry, ...prev]);

    setIsProcessing(false);
    setDialogOpen(false);

    toast.success(
      `تم الاشتراك في خطة ${selectedPlan.name} بنجاح!`,
      {
        description: `ستبدأ في الاستفادة من جميع مميزات خطة ${selectedPlan.name} فوراً.`,
        duration: 4000,
      }
    );

    setSelectedPlan(null);
  };

  const handleUpgrade = () => {
    plansRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    const currentPlan = plans.find((p) => p.id === currentPlanId);
    if (currentPlan && currentPlan.id === 'free') return;

    setCurrentPlanId('free');
    toast.info('تم إلغاء الاشتراك والعودة إلى الخطة المجانية', {
      duration: 3000,
    });
  };

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic"
      dir="rtl"
    >
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-sovereign-gold/5 rounded-full blur-[200px] opacity-20 pointer-events-none" />

      {/* Header Spacer */}
      <div className="h-24 md:h-32" />

      {/* Active Subscription */}
      <ActiveSubscription
        currentPlanId={currentPlanId}
        plansList={plans}
        onUpgrade={handleUpgrade}
        onCancel={handleCancel}
      />

      {/* Decorative Divider */}
      <div className="max-w-5xl mx-auto w-full px-4">
        <div className="h-px bg-gradient-to-l from-transparent via-sovereign-gold/20 to-transparent" />
      </div>

      {/* Plans */}
      <div ref={plansRef}>
        <PlansSection
          currentPlanId={currentPlanId}
          onSelectPlan={handleSelectPlan}
        />
      </div>

      {/* Decorative Divider */}
      <div className="max-w-5xl mx-auto w-full px-4">
        <div className="h-px bg-gradient-to-l from-transparent via-sovereign-gold/20 to-transparent" />
      </div>

      {/* History */}
      <HistorySection history={history} />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        plan={selectedPlan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmSubscription}
        isProcessing={isProcessing}
      />
    </div>
  );
}