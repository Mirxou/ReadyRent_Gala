'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { formatNumber } from '@/lib/utils';
import { type Plan } from './types';

interface ConfirmationDialogProps {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function ConfirmationDialog({ plan, open, onOpenChange, onConfirm, isProcessing }: ConfirmationDialogProps) {
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
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">الخطة</span>
              <span className="font-bold">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">السعر الشهري</span>
              <span className="font-bold text-sovereign-gold">
                {plan.price === 0 ? 'مجاني' : `${formatNumber(plan.price)} دج`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">دورة الفوترة</span>
              <span className="font-bold">شهري</span>
            </div>
            <div className="border-t border-white/5 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold">المبلغ الإجمالي</span>
              <span className="text-xl font-black text-sovereign-gold">
                {plan.price === 0 ? 'مجاني' : `${formatNumber(plan.price)} دج`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center">
            {plan.features.slice(0, 4).map((f) => (
              <span key={f} className="text-[10px] px-2.5 py-1 rounded-full border border-sovereign-gold/15 text-sovereign-gold/70 bg-sovereign-gold/5">
                {f}
              </span>
            ))}
            {plan.features.length > 4 && (
              <span className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground">
                +{plan.features.length - 4} أخرى
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <SovereignButton variant="primary" size="sm" className="flex-1" onClick={onConfirm} isLoading={isProcessing}>
              تأكيد الاشتراك
            </SovereignButton>
            <SovereignButton variant="ghost" size="sm" className="flex-1" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              إلغاء
            </SovereignButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}