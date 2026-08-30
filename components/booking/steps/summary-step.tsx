'use client';

import { useBookingStore } from '@/lib/hooks/use-booking-store';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Receipt, Calendar, Package, ArrowRightLeft } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function SummaryStep() {
  const { formData } = useBookingStore();

  const days = formData.startDate && formData.endDate
    ? Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Fetch actual product price
  const { data: productData } = useQuery({
    queryKey: ['product-price', formData.productId],
    queryFn: async () => {
      if (!formData.productId) return null;
      const res = await fetch(`/api/products/${formData.productId}`);
      const json = await res.json();
      return json.data || json;
    },
    enabled: !!formData.productId,
  });

  // Fetch insurance plans to get the actual price
  const { data: insurancePlans } = useQuery({
    queryKey: ['insurance-plans-summary'],
    queryFn: async () => {
      const res = await fetch('/api/insurance');
      const json = await res.json();
      return json.data || [];
    },
    enabled: formData.hasInsurance,
  });

  const basePrice = (productData?.pricePerDay as number) || 0;
  // Use the most expensive plan (comprehensive) when insurance is enabled
  const insurancePlansList = Array.isArray(insurancePlans) ? insurancePlans : [];
  const insurancePrice = formData.hasInsurance && insurancePlansList.length > 0
    ? Math.max(...insurancePlansList.map((p: { price: number }) => p.price))
    : 0;
  const subtotal = (basePrice * days) + insurancePrice;
  const deposit = subtotal > 0 ? Math.round(subtotal * 0.4) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-sovereign-gold/10 rounded-2xl text-sovereign-gold">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ملخص الفاتورة</h2>
          <p className="text-muted-foreground text-sm">راجع التفاصيل قبل التوجه لخطوة الدفع.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Booking Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-[2rem] border border-border flex items-center gap-3">
            <div className="p-2 bg-background rounded-xl shadow-sm text-sovereign-gold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">المدة</span>
              <span className="font-bold">{days} أيام</span>
            </div>
          </div>
          <div className="p-4 bg-muted/50 rounded-[2rem] border border-border flex items-center gap-3">
            <div className="p-2 bg-background rounded-xl shadow-sm text-sovereign-gold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">التأمين</span>
              <span className="font-bold">{formData.hasInsurance ? 'مفعل' : 'غير مفعل'}</span>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="p-6 bg-background rounded-[2rem] border border-border shadow-sm space-y-4">
          {basePrice === 0 ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">سعر الإيجار ({days} أيام)</span>
              <span className="font-medium">{formatNumber(basePrice * days)} دج</span>
            </div>
          )}
          {formData.hasInsurance && insurancePrice > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">خدمات إضافية + تأمين</span>
              <span className="font-medium">+{formatNumber(insurancePrice)} دج</span>
            </div>
          )}
          <div className="h-px bg-border w-full" />
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold">الإجمالي</span>
            <span className="text-2xl font-black text-sovereign-gold">
              {basePrice === 0 ? '...' : `${formatNumber(subtotal)} دج`}
            </span>
          </div>
        </div>

        {/* Escrow Split Highlight */}
        <div className="p-6 bg-sovereign-gold/5 rounded-[2rem] border border-sovereign-gold/20 border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <ArrowRightLeft className="w-5 h-5 text-sovereign-gold" />
            <span className="font-bold text-foreground">نظام العربون (60/40)</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            ستقوم بدفع{' '}
            <span className="font-black text-foreground">
              40% ({basePrice === 0 ? '...' : `${formatNumber(deposit)} دج`})
            </span>{' '}
            الآن كعربون حماية. يتم تحويل الباقي عند استلام المنتج وتأكيد الجودة.
          </p>
          <div className="flex items-center justify-between p-3 bg-background rounded-2xl">
            <span className="text-sm font-bold text-muted-foreground">مطلوب للدفع الآن:</span>
            <span className="text-xl font-black text-sovereign-gold">
              {basePrice === 0 ? '...' : `${formatNumber(deposit)} دج`}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
