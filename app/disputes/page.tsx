'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Sparkles, ChevronLeft, ChevronRight, Check, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { AIDisputeAssistant } from '@/components/disputes/AIDisputeAssistant';
import { DiscoveryStep } from '@/components/disputes/steps/discovery-step';
import { GroundsStep } from '@/components/disputes/steps/grounds-step';
import { EvidenceStep } from '@/components/disputes/steps/evidence-step';
import { useDisputeStore } from '@/lib/hooks/use-dispute-store';
import { disputesApi } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DisputesPage() {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { step, formData, nextStep, prevStep, resetWizard } = useDisputeStore();

  const steps = [
    { id: 1, title: 'نوع النزاع', component: <DiscoveryStep /> },
    { id: 2, title: 'تفاصيل النزاع', component: <GroundsStep /> },
    { id: 3, title: 'الأدلة', component: <EvidenceStep /> },
  ];

  const canProceed = () => {
    if (step === 1) return !!formData.disputeType;
    if (step === 2) return !!formData.subject && !!formData.description;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await disputesApi.initiateDispute({
        booking_id: formData.bookingId || 0,
        claim_type: formData.disputeType,
        description: formData.description + '\n\n' + formData.subject,
      });
      toast.success('تم إنشاء النزاع بنجاح');
      setIsSuccess(true);
      resetWizard();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'حدث خطأ أثناء إنشاء النزاع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIsSuccess(false);
    resetWizard();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white" dir="rtl">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <SovereignGlow color="purple" intensity="high" className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] opacity-20">
          <div />
        </SovereignGlow>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent">
                النزاعات والدعم
              </h1>
              <p className="text-muted-foreground text-base">إدارة النزاعات وطلبات الدعم</p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-l from-gala-purple to-gala-pink text-white font-bold px-6 py-2.5 rounded-2xl shadow-lg shadow-gala-purple/20 hover:shadow-gala-purple/40 transition-shadow"
            >
              {showForm ? 'إلغاء' : (
                <span className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  إنشاء نزاع جديد
                </span>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Form placeholder replaced with multi-step form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <GlassPanel className="p-8">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"
                    >
                      <Check className="w-8 h-8 text-emerald-400" />
                    </motion.div>
                    <div>
                      <p className="text-xl font-bold text-emerald-400 mb-1">تم إنشاء النزاع بنجاح</p>
                      <p className="text-sm text-muted-foreground">
                        سيتم مراجعة نزاعك من قبل فريق الدعم والتواصل معك قريباً
                      </p>
                    </div>
                    <Button
                      onClick={handleCloseForm}
                      variant="outline"
                      className="mt-4 rounded-2xl"
                    >
                      العودة للقائمة
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Stepper */}
                    <div className="flex items-center justify-between relative mb-8 px-4">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0" />
                      <div
                        className="absolute top-1/2 right-0 h-0.5 bg-gala-purple -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                      />
                      {steps.map((s) => (
                        <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                            step === s.id ? "bg-gala-purple text-white scale-110 shadow-lg shadow-gala-purple/30" :
                            step > s.id ? "bg-gala-purple text-white" : "bg-white/10 text-white/40"
                          )}>
                            {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            step >= s.id ? "text-gala-purple" : "text-white/40"
                          )}>
                            {s.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[300px]">
                      {steps.find((s) => s.id === step)?.component}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                      <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={step === 1 || isSubmitting}
                        className="rounded-2xl px-6 h-12 font-bold text-muted-foreground hover:bg-white/5"
                      >
                        <ChevronLeft className="w-5 h-5 ml-2" />
                        السابق
                      </Button>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          onClick={handleCloseForm}
                          className="text-muted-foreground font-medium"
                        >
                          إلغاء
                        </Button>
                        {step < steps.length ? (
                          <Button
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="rounded-2xl px-8 h-12 font-bold bg-gala-purple hover:bg-gala-purple/80 text-white shadow-lg shadow-gala-purple/20"
                          >
                            المتابعة
                            <ChevronRight className="w-5 h-5 mr-2" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="rounded-2xl px-8 h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-5 h-5 ml-2" />
                                إرسال النزاع
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
        >
          <GlassPanel className="p-10 md:p-14 text-center relative overflow-hidden">
            {/* Decorative sparkle */}
            <div className="absolute top-4 right-4 w-20 h-20 opacity-30">
              <SovereignSparkle>
                <Sparkles className="w-8 h-8 text-gala-gold/40" />
              </SovereignSparkle>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gala-purple/20 to-gala-gold/10 border border-white/10 flex items-center justify-center"
            >
              <Shield className="w-12 h-12 text-gala-gold/80" />
            </motion.div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              لا توجد نزاعات مفتوحة
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
              لا توجد أي نزاعات مفتوحة حالياً. إذا واجهت أي مشكلة مع حجز سابق، يمكنك إنشاء نزاع جديد وسنساعدك في حله.
            </p>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-l from-gala-purple to-gala-pink text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-gala-purple/25 hover:shadow-gala-purple/40 transition-shadow"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  إنشاء نزاع جديد
                </span>
              </Button>
            </motion.div>
          </GlassPanel>
        </motion.div>
      </div>

      {/* AI Assistant */}
      <AIDisputeAssistant />
    </div>
  );
}