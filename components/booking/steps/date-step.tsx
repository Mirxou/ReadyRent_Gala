'use client';

import { useBookingStore } from '@/lib/hooks/use-booking-store';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function DateStep() {
  const { formData, updateFormData } = useBookingStore();

  const handleSelect = (range: any) => {
    updateFormData({
      startDate: range?.from || null,
      endDate: range?.to || null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">اختر فترة الإيجار</h2>
          <p className="text-gray-500 text-sm">حدد تاريخ البداية والنهاية لمناسبتك.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <Calendar
            mode="range"
            selected={{
              from: formData.startDate || undefined,
              to: formData.endDate || undefined,
            }}
            onSelect={handleSelect}
            numberOfMonths={1}
            locale={ar}
            className="rounded-3xl border-none"
            classNames={{
              day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white",
              day_today: "bg-gray-100 text-blue-600 font-bold",
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <Label className="text-gray-400 mb-2 block">لقد اخترت:</Label>
            {formData.startDate && formData.endDate ? (
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-gray-900">
                  {format(formData.startDate, 'PPP', { locale: ar })}
                </span>
                <span className="text-gray-400 text-sm">إلى</span>
                <span className="text-xl font-bold text-gray-900">
                  {format(formData.endDate, 'PPP', { locale: ar })}
                </span>
              </div>
            ) : (
              <span className="text-gray-400 italic">بانتظار تحديد التواريخ...</span>
            )}
          </div>

          <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-sm leading-relaxed">
            <Info className="w-5 h-5 shrink-0" />
            <p>
              يتم احتساب السعر بناءً على عدد الأيام المختارة. تأكد من مراجعة سياسة الإرجاع قبل التأكيد.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
