'use client';

import { useBookingStore } from '@/lib/hooks/use-booking-store';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Truck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXTRAS = [
  { id: 'cleaning', name: 'تنظيف احترافي', price: 1500, icon: Sparkles, description: 'نضمن لك استلام المنتج في أبهى حلة.' },
  { id: 'express', name: 'توصيل سريع', price: 2000, icon: Zap, description: 'توصيل في أقل من 4 ساعات داخل العاصمة.' },
  { id: 'pickup', name: 'استلام من المقر', price: 0, icon: Truck, description: 'مجاني تماماً من أحد نقاط الاستلام لدينا.' },
];

export function ConfigStep() {
  const { formData, updateFormData } = useBookingStore();

  const toggleExtra = (id: string) => {
    const current = formData.extraServices;
    const next = current.includes(id) 
      ? current.filter(x => x !== id) 
      : [...current, id];
    updateFormData({ extraServices: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">إعدادات الحجز</h2>
          <p className="text-gray-500 text-sm">اختر الخدمات الإضافية وخيارات التأمين.</p>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-xl shadow-blue-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">تأمين Rentily الشامل</span>
          </div>
          <Switch 
            checked={formData.hasInsurance}
            onCheckedChange={(val) => updateFormData({ hasInsurance: val })}
            className="data-[state=checked]:bg-white data-[state=unchecked]:bg-blue-800"
          />
        </div>
        <p className="text-blue-100 text-sm leading-relaxed">
          يوفر لك حماية كاملة ضد الأضرار العرضية بنسبة تصل إلى 90%. نوصي بترك هذا الخيار مفعلاً لراحة بالك.
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-bold block mb-4">خدمات إضافية</Label>
        <div className="grid gap-4">
          {EXTRAS.map((extra) => {
            const Icon = extra.icon;
            const isSelected = formData.extraServices.includes(extra.id);
            return (
              <div
                key={extra.id}
                onClick={() => toggleExtra(extra.id)}
                className={cn(
                  "p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                  isSelected 
                    ? "border-blue-600 bg-blue-50/50" 
                    : "border-gray-100 hover:border-gray-200"
                )}
              >
                <div className="flex gap-4 items-center">
                  <div className={cn(
                    "p-3 rounded-2xl transition-colors",
                    isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{extra.name}</h3>
                    <p className="text-xs text-gray-500">{extra.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900">
                    {extra.price > 0 ? `+${extra.price} دج` : 'مجاني'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
