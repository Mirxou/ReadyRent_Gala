'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBookingStore } from '@/lib/hooks/use-booking-store';
import { DateStep } from './steps/date-step';
import { ConfigStep } from './steps/config-step';
import { VerificationStep } from './steps/verification-step';
import { SummaryStep } from './steps/summary-step';
import { PaymentStep } from './steps/payment-step';
import { SuccessView } from './success-view';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookingsApi } from '@/lib/api/bookings';
import { paymentsApi } from '@/lib/api/payments';
import { toast } from 'sonner';

export function BookingWizard() {
  const { 
    step, 
    isOpen, 
    setIsOpen, 
    nextStep, 
    prevStep, 
    formData, 
    resetWizard 
  } = useBookingStore();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [bookingRef, setBookingRef] = React.useState('');

  const handleNext = async () => {
    if (step < 5) {
      nextStep();
      return;
    }

    // Final Submission (Step 5)
    setIsSubmitting(true);
    try {
      // 1. Create Booking
      const bookingRes = await bookingsApi.create({
        product_id: Number(formData.productId),
        start_date: formData.startDate?.toISOString() || '',
        end_date: formData.endDate?.toISOString() || '',
        has_insurance: formData.hasInsurance,
        extra_services: formData.extraServices,
      });

      // 2. Process Payment & Signature
      const booking = bookingRes.data;
      const paymentMethodId = formData.paymentMethod ?? 'visa';
      await paymentsApi.createPayment(booking.id, paymentMethodId);

      setBookingRef(booking.id.toString());
      setIsSuccess(true);
      toast.success('تمت العملية بنجاح!', {
        description: 'تم توثيق عقدك وتحصين الدفع في الضمان.',
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء إتمام العملية', {
        description: 'يرجى التحقق من تفاصيل الدفع والمحاولة مرة أخرى.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'التاريخ', component: <DateStep /> },
    { id: 2, title: 'الإعدادات', component: <ConfigStep /> },
    { id: 3, title: 'التحقق', component: <VerificationStep /> },
    { id: 4, title: 'الملخص', component: <SummaryStep /> },
    { id: 5, title: 'الدفع', component: <PaymentStep /> },
  ];

  const currentStepData = steps.find((s) => s.id === step);

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-8 bg-white rounded-[3rem] border-none shadow-2xl overflow-hidden">
          <SuccessView bookingReference={bookingRef} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-[3rem] border-none shadow-2xl">
        <div className="flex flex-col h-[85vh] md:h-[750px]">
          {/* Header & Progress */}
          <div className="p-8 pb-4 bg-white z-20">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black tracking-tighter text-blue-900 flex items-center gap-2">
                <Sparkles className="text-gold-500 h-6 w-6" />
                حجز منتج فاخر
              </DialogTitle>
            </DialogHeader>

            {/* Stepper Infrastructure */}
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
              
              {steps.map((s) => (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                    step === s.id ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200" :
                    step > s.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                  )}>
                    {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    step >= s.id ? "text-blue-600" : "text-gray-400"
                  )}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-8 py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData?.component}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-gray-50/80 backdrop-blur-md flex items-center justify-between border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={step === 1 || isSubmitting}
              className="rounded-2xl px-6 h-14 font-bold text-gray-500 hover:bg-gray-200/50"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              السابق
            </Button>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 font-medium"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleNext}
                disabled={isSubmitting || (step === 1 && !formData.startDate) || (step === 5 && !formData.signature)}
                className={cn(
                  "rounded-2xl px-10 h-14 font-black shadow-xl transition-all active:scale-95",
                  step === 5 ? "bg-success-600 hover:bg-success-700 text-white shadow-success-200" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step === 4 ? (
                  'متابعة للدفع والتوقيع'
                ) : step === 5 ? (
                  'اتمام العملية والتحصين'
                ) : (
                  <>
                    المتابعة
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
