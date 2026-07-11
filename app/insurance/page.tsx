'use client'

import { formatNumber } from '@/lib/utils';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Shield, Check, ArrowLeft, Info, Phone, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import Link from 'next/link';
import { toast } from 'sonner';

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */
interface ApiPlan {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  coverageAr: string;
  coverageEn: string;
  isActive: boolean;
}

interface EnrichedPlan {
  id: string;
  name: string;
  price: number;
  icon: string;
  features: string[];
  coverage: string;
  color: string;
  borderColor: string;
  popular: boolean;
}

/* ────────────────────────────────────────────
   Local enrichment data (API doesn't provide these)
   ──────────────────────────────────────────── */
const planEnrichment: Record<
  number,
  Omit<EnrichedPlan, 'id' | 'name' | 'price' | 'coverage'>
> = {
  1: {
    icon: '🛡️',
    features: [
      'تغطية التلفيات البسيطة',
      'تعويض حتى 5,000 دج',
      'مدة الكراء حتى 3 أيام',
      'دعم عبر البريد الإلكتروني',
    ],
    color: 'from-slate-600 to-slate-400',
    borderColor: 'border-slate-500/30',
    popular: false,
  },
  2: {
    icon: '⚔️',
    features: [
      'تغطية التلفيات المتوسطة والكبيرة',
      'تعويض حتى 20,000 دج',
      'مدة الكراء حتى 7 أيام',
      'دعم هاتفي على مدار الساعة',
      'استبدال المنتج في حالة التلف الكلي',
    ],
    color: 'from-sovereign-gold/80 to-amber-500',
    borderColor: 'border-sovereign-gold/40',
    popular: true,
  },
  3: {
    icon: '👑',
    features: [
      'تغطية شاملة بلا حدود',
      'تعويض حتى 50,000 دج',
      'مدة الكراء حتى 14 يوم',
      'مستشار تأمين مخصص',
      'استبدال فوري بدون أسئلة',
      'تأمين الشحن والنقل',
      'أولوية في المعالجة',
    ],
    color: 'from-purple-600 to-pink-500',
    borderColor: 'border-purple-400/40',
    popular: false,
  },
};

function mapApiToPlan(apiPlan: ApiPlan): EnrichedPlan {
  const enrichment = planEnrichment[apiPlan.id] || planEnrichment[1];
  return {
    id: String(apiPlan.id),
    name: apiPlan.nameAr,
    price: apiPlan.price,
    coverage: apiPlan.coverageAr,
    ...enrichment,
  };
}

const steps = [
  {
    step: 1,
    title: 'اختر المنتج',
    description: 'اختر المنتج الذي تريد استئجاره من المنصة',
  },
  {
    step: 2,
    title: 'أضف التأمين',
    description: 'اختر خطة التأمين المناسبة أثناء عملية الحجز',
  },
  {
    step: 3,
    title: 'استلم وتأمّن',
    description: 'استلم المنتج وأنت مطمئن بوجود التغطية التأمينية',
  },
  {
    step: 4,
    title: 'التعويض عند الحاجة',
    description: 'في حالة أي تلف، قدم طلب تعويض وسنحل الأمر بسرعة',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
};

/* ────────────────────────────────────────────
   Loading Skeleton
   ──────────────────────────────────────────── */
function PlansLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[2rem] border border-white/5 bg-card p-6 space-y-5">
          <div className="text-center">
            <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
            <Skeleton className="h-6 w-28 mx-auto mb-2" />
            <Skeleton className="h-10 w-24 mx-auto" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-start gap-3">
                <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function InsurancePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasedPlan, setPurchasedPlan] = useState<string | null>(null);

  // Fetch insurance plans from API
  const { data, isLoading, isError } = useQuery({
    queryKey: ['insurance-plans'],
    queryFn: () =>
      fetch('/api/insurance')
        .then((r) => r.json())
        .then((d) => d.data || []),
  });

  const plans: EnrichedPlan[] = (Array.isArray(data) ? data : []).map(mapApiToPlan);
  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  const handleSelectPlan = (planId: string) => {
    if (purchasedPlan) return;
    setSelectedPlan(planId);
    setShowConfirm(true);
  };

  const handleConfirmPurchase = async () => {
    setIsPurchasing(true);
    setShowConfirm(false);
    setIsPurchasing(false);
    toast.info('سيتم إضافة هذه الميزة قريباً');
  };

  const handleContactSupport = () => {
    toast.info('سيتم التواصل معك قريباً');
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 bg-sovereign-gold/10 text-sovereign-gold border border-sovereign-gold/30 rounded-full py-1 px-4 text-xs font-bold mb-6">
              <Shield className="w-4 h-4" />
              حماية موثوقة لمنتجاتك المستأجرة
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-6xl font-black mb-4"
          >
            التأمين على <span className="text-sovereign-gold">المنتجات</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            استأجر بثقة. تقدم STANDARD.Rent خطط تأمين شاملة تحميك من أي تلف أو فقدان
            للمنتجات المستأجرة. اختر الخطة المناسبة لك.
          </motion.p>
        </motion.div>

        {/* Error State */}
        {isError && (
          <div className="text-center mb-16">
            <p className="text-red-400 text-sm">تعذر تحميل خطط التأمين. يرجى المحاولة لاحقاً.</p>
          </div>
        )}

        {/* Insurance Plan Cards */}
        {isLoading ? (
          <PlansLoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                custom={index}
              >
                <Card
                  className={`relative rounded-[2rem] overflow-hidden border ${
                    plan.popular
                      ? 'border-sovereign-gold/50 shadow-[0_0_40px_rgba(234,179,8,0.1)]'
                      : 'border-white/5'
                  } bg-card h-full flex flex-col`}
                >
                  {plan.popular && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-sovereign-gold text-black font-bold text-xs">
                        الأكثر طلباً
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-8 text-center">
                    <div className="text-4xl mb-3">{plan.icon}</div>
                    <CardTitle className="text-xl font-bold mb-1">
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-baseline justify-center gap-1 mt-3">
                      <span className="text-3xl md:text-4xl font-black text-sovereign-gold">
                        {formatNumber(plan.price)}
                      </span>
                      <span className="text-muted-foreground text-sm">دج / لكل حجز</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground mb-5 text-center leading-relaxed">
                      {plan.coverage}
                    </p>

                    <div className="space-y-3 flex-1 mb-6">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <SovereignButton
                      variant={plan.popular ? 'primary' : 'secondary'}
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={purchasedPlan === plan.id}
                      isLoading={purchasedPlan === plan.id}
                    >
                      {purchasedPlan === plan.id ? '✓ مشتراة' : 'اختيار هذه الخطة'}
                    </SovereignButton>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* How It Works */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mb-20"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl md:text-4xl font-black text-center mb-12"
          >
            كيف يعمل <span className="text-sovereign-gold">التأمين؟</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div key={step.step} variants={fadeUp} custom={index + 1}>
                <GlassPanel
                  className="p-6 rounded-[2rem] text-center h-full"
                  variant="obsidian"
                  gradientBorder
                >
                  <div className="w-12 h-12 rounded-full bg-sovereign-gold/10 border border-sovereign-gold/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-sovereign-gold font-black text-lg">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Why Insurance Section */}
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
            لماذا <span className="text-sovereign-gold">التأمين؟</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={fadeUp} custom={1}>
              <GlassPanel
                className="p-8 rounded-[2rem] h-full"
                variant="obsidian"
              >
                <Shield className="w-10 h-10 text-sovereign-gold mb-4" />
                <h3 className="text-lg font-bold mb-2">راحة بالك</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  لا تقلق بعد الآن بشأن التلفيات المحتملة. التأمين يغطيك بالكامل
                  ويتيح لك الاستمتاع بتجربة الإيجار بثقة تامة.
                </p>
              </GlassPanel>
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <GlassPanel
                className="p-8 rounded-[2rem] h-full"
                variant="obsidian"
              >
                <FileText className="w-10 h-10 text-sovereign-gold mb-4" />
                <h3 className="text-lg font-bold mb-2">تعويض سريع</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  عملية تعويض مبسطة وسريعة. قدم طلبك واحصل على التعويض خلال
                  24-48 ساعة عمل بعد مراجعة الحالة.
                </p>
              </GlassPanel>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <GlassPanel
                className="p-8 rounded-[2rem] h-full"
                variant="obsidian"
              >
                <Phone className="w-10 h-10 text-sovereign-gold mb-4" />
                <h3 className="text-lg font-bold mb-2">دعم متواصل</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  فريق الدعم متاح للإجابة على استفساراتك ومساعدتك في أي وقت.
                  الخدمة بالعربية ومخصصة للسوق الجزائري.
                </p>
              </GlassPanel>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="mt-20 text-center"
        >
          <GlassPanel
            className="p-10 md:p-16 rounded-[3rem] text-center"
            variant="obsidian"
            gradientBorder
          >
            <Info className="w-12 h-12 text-sovereign-gold mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-black mb-4">
              لديك أسئلة حول التأمين؟
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              تواصل مع فريق الدعم للحصول على استشارة مجانية حول أفضل خطة تأمين
              تناسب احتياجاتك
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SovereignButton variant="primary" size="lg" onClick={handleContactSupport}>
                تواصل مع الدعم
              </SovereignButton>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  العودة للرئيسية
                </Link>
              </Button>
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-sovereign-obsidian border-sovereign-gold/20 text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-sovereign-gold text-right">
              تأكيد شراء خطة التأمين
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-right">
              تأكد من تفاصيل الخطة قبل التأكيد
            </DialogDescription>
          </DialogHeader>

          {selectedPlanData && (
            <div className="space-y-4 my-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedPlanData.icon}</span>
                <div>
                  <p className="font-bold text-lg">{selectedPlanData.name}</p>
                  <p className="text-sovereign-gold font-black text-xl">
                    {formatNumber(selectedPlanData.price)} دج / لكل حجز
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-sm font-bold mb-2 text-white/70">المزايا المشمولة:</p>
                <ul className="space-y-2">
                  {selectedPlanData.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3 sm:gap-0">
            <SovereignButton
              variant="primary"
              className="flex-1"
              onClick={handleConfirmPurchase}
              isLoading={isPurchasing}
            >
              {isPurchasing ? 'جارٍ المعالجة...' : 'تأكيد الشراء'}
            </SovereignButton>
            <SovereignButton
              variant="secondary"
              className="flex-1"
              onClick={() => setShowConfirm(false)}
              disabled={isPurchasing}
            >
              إلغاء
            </SovereignButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}