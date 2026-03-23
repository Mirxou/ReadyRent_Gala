'use client';

import { useBookingStore } from '@/lib/hooks/use-booking-store';
import { motion } from 'framer-motion';
import { Landmark, Fingerprint, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VerificationStep() {
  const { formData } = useBookingStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
          <Fingerprint className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">نظام التحقق السيادي</h2>
          <p className="text-gray-500 text-sm">نحن نضمن حقوقك عبر نظام قضائي متكامل.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Owner Status */}
        <div className="p-6 rounded-[2rem] border border-gray-100 bg-white shadow-sm flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">المؤجر (المالك)</h3>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>هوية موثقة عبر النظام السيادي</span>
              </div>
            </div>
          </div>
          <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl">
            <span className="block text-xs text-emerald-600 font-black">درجة الثقة</span>
            <span className="text-xl font-black text-emerald-700">9.8</span>
          </div>
        </div>

        {/* Renter Status */}
        <div className="p-6 rounded-[2rem] border-2 border-dashed border-amber-200 bg-amber-50/20 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">هويتك الرقمية</h3>
              <p className="text-xs text-amber-600">تنبيه: سيطلب منك التوقيع الرقمي عند الدفع.</p>
            </div>
          </div>
          <div className="px-5 py-2 bg-amber-100 rounded-xl text-amber-700 font-bold text-sm">
            جاري المراجعة
          </div>
        </div>

        {/* Judicial Guarantee */}
        <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100/50 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>الضمان القضائي الجزائري</span>
          </div>
          <p className="text-indigo-800/70 text-sm leading-relaxed">
            هذا الحجز محمي بموجب العقد الرقمي الموحد. في حال نشوب خلاف، يتم الفصل فيه آلياً عبر نظام "الفصل السريع" (Fast-Track Dispute) المدمج في المنصة.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
