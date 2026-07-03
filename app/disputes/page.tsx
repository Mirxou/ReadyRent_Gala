'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { AIDisputeAssistant } from '@/components/disputes/AIDisputeAssistant';

export default function DisputesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white" dir="rtl">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <SovereignGlow className="top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] opacity-20" />
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

        {/* Form placeholder (non-functional) */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <GlassPanel className="p-8">
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gala-purple/20 to-gala-gold/10 border border-white/10 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-gala-gold/80" />
                  </div>
                  <div>
                    <p className="text-lg font-bold mb-1">نموذج إنشاء نزاع</p>
                    <p className="text-sm text-muted-foreground">
                      ستتمكن قريباً من إنشاء نزاع جديد مباشرة من هنا
                    </p>
                  </div>
                </div>
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
            <SovereignSparkle className="absolute top-4 right-4 w-20 h-20 opacity-30" />

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