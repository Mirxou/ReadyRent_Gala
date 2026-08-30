'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ActiveSubscription } from './_components/active-subscription';
import { PlansSection } from './_components/plans-section';
import { HistorySection } from './_components/history-section';
import { ConfirmationDialog } from './_components/confirmation-dialog';
import { ActiveSubscriptionSkeleton, PlansSkeleton, HistorySkeleton } from './_components/skeletons';
import { type Plan, type SubscriptionHistory, mapApiPlan } from './_components/types';

export default function SubscriptionsPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () =>
      fetch('/api/subscriptions')
        .then((r) => r.json())
        .then((d) => d.data || d),
  });

  // API now returns { plans, active_plan, history }
  const activePlan = data?.active_plan as Record<string, unknown> | null;
  const currentPlanId = (activePlan?.id as string) || 'free';
  const activeEndDate = activePlan?.end_date as string | null;
  const activeBookingsUsed = (activePlan?.bookings_used as number) || 0;
  const plans: Plan[] = (data?.plans || []).map(mapApiPlan);
  const history: SubscriptionHistory[] = (data?.history || []).map(
    (h: Record<string, unknown>) => ({
      id: (h.id as string) || '',
      date: (h.date as string) || '',
      plan: (h.plan as string) || '',
      amount: (h.amount as number) || 0,
      status: (h.status as 'مدفوع' | 'نشط' | 'ملغي') || 'مدفوع',
    })
  );

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    setIsSubscribing(true);
    setDialogOpen(false);
    try {
      const res = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`تم تفعيل اشتراك خطة ${selectedPlan.name} بنجاح`);
      } else {
        toast.error(json.message_ar || 'فشل في تفعيل الاشتراك');
      }
    } catch {
      toast.error('حدث خطأ أثناء معالجة طلب الاشتراك');
    } finally {
      setIsSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const handleUpgrade = () => {
    plansRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = async () => {
    if (currentPlanId === 'free') return;
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: currentPlanId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('تم إلغاء الاشتراك والعودة إلى الخطة المجانية');
      } else {
        toast.error(json.message_ar || 'فشل إلغاء الاشتراك');
      }
    } catch {
      toast.error('حدث خطأ أثناء إلغاء الاشتراك');
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-sovereign-obsidian text-sovereign-white font-arabic" dir="rtl">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-sovereign-gold/5 rounded-full blur-[200px] opacity-20 pointer-events-none" />
      <div className="h-24 md:h-32" />

      {isLoading ? (
        <ActiveSubscriptionSkeleton />
      ) : isError ? (
        <section className="py-10 md:py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-red-400 text-sm">تعذر تحميل بيانات الاشتراك. يرجى المحاولة لاحقاً.</p>
          </div>
        </section>
      ) : (
        <ActiveSubscription currentPlanId={currentPlanId} plansList={plans} onUpgrade={handleUpgrade} onCancel={handleCancel} endDate={activeEndDate} bookingsUsed={activeBookingsUsed} />
      )}

      <div className="max-w-5xl mx-auto w-full px-4">
        <div className="h-px bg-gradient-to-l from-transparent via-sovereign-gold/20 to-transparent" />
      </div>

      <div ref={plansRef}>
        {isLoading ? <PlansSkeleton /> : <PlansSection currentPlanId={currentPlanId} plansList={plans} onSelectPlan={handleSelectPlan} />}
      </div>

      <div className="max-w-5xl mx-auto w-full px-4">
        <div className="h-px bg-gradient-to-l from-transparent via-sovereign-gold/20 to-transparent" />
      </div>

      {isLoading ? <HistorySkeleton /> : <HistorySection history={history} />}

      <ConfirmationDialog
        plan={selectedPlan}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmSubscription}
        isProcessing={isSubscribing}
      />
    </div>
  );
}
