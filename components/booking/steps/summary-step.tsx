'use client';

import { useBookingStore } from '@/lib/hooks/use-booking-store';
import { motion } from 'framer-motion';
import { Receipt, CreditCard, Calendar, Package, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function SummaryStep() {
  const { formData } = useBookingStore();

  const days = formData.startDate && formData.endDate 
    ? Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const basePrice = 5000; // Mock base price
  const insurancePrice = formData.hasInsurance ? 2500 : 0;
  const subtotal = (basePrice * days) + insurancePrice;
  const deposit = subtotal * 0.4; // 40% verdict split principle

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ملخص الفاتورة</h2>
          <p className="text-gray-500 text-sm">راجع التفاصيل قبل التوجه لخطوة الدفع.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Booking Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">المدة</span>
              <span className="font-bold text-gray-900">{days} أيام</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">التأمين</span>
              <span className="font-bold text-gray-900">{formData.hasInsurance ? 'مفعل' : 'غير مفعل'}</span>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">سعر الإيجار ({days} أيام)</span>
            <span className="font-medium text-gray-900">{basePrice * days} دج</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">خدمات إضافية + تأمين</span>
            <span className="font-medium text-gray-900">+{insurancePrice} دج</span>
          </div>
          <div className="h-px bg-gray-100 w-full" />
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold text-gray-900">الإجمالي</span>
            <span className="text-2xl font-black text-blue-600">{subtotal} دج</span>
          </div>
        </div>

        {/* Escrow Split Highlight */}
        <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-900">نظام العربون (60/40)</span>
          </div>
          <p className="text-sm text-blue-800/70 leading-relaxed mb-4">
            ستقوم بدفع <span className="font-black text-blue-900">40% ({deposit} دج)</span> الآن كعربون حماية. يتم تحويل الباقي عند استلام المنتج وتأكيد الجودة.
          </p>
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl">
            <span className="text-sm font-bold text-gray-600">مطلوب للدفع الآن:</span>
            <span className="text-xl font-black text-blue-600">{deposit} دج</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
