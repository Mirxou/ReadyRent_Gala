'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, Calendar, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookingStore } from '@/lib/hooks/use-booking-store';

interface SuccessViewProps {
  bookingReference: string;
}

export function SuccessView({ bookingReference }: SuccessViewProps) {
  const { resetWizard, setIsOpen } = useBookingStore();

  useEffect(() => {
    // Trigger celebration
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleDone = () => {
    resetWizard();
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="w-24 h-24 bg-success-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-success-200"
      >
        <CheckCircle2 className="w-12 h-12" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">تم الحجز بنجاح!</h2>
        <p className="text-gray-500 font-medium">تم تحصين أموالك في الضمان وتوثيق عقدك رقمياً.</p>
      </div>

      <div className="w-full max-w-sm bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">رقم المرجع</span>
          <span className="font-mono font-black text-primary-600">{bookingReference}</span>
        </div>
        <hr className="border-gray-200" />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-3 bg-white rounded-2xl border border-gray-100 italic">
            <Calendar className="h-5 w-5 text-primary-500 mb-1" />
            <span className="text-[10px] text-gray-500">موعد الإستلام</span>
            <span className="text-xs font-bold">غداً، 10:00 صباحاً</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white rounded-2xl border border-gray-100">
            <FileText className="h-5 w-5 text-success-500 mb-1" />
            <span className="text-[10px] text-gray-500">حالة العقد</span>
            <span className="text-xs font-bold">موثق سيادياً</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full gap-3 px-4">
        <Button onClick={handleDone} className="w-full bg-gray-900 hover:bg-black text-white h-14 rounded-2xl font-bold text-lg">
          عرض حجوزاتي
        </Button>
        <Button variant="ghost" onClick={handleDone} className="w-full h-12 rounded-xl text-gray-500 font-bold group">
          العودة للرئيسية
          <ArrowRight className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
