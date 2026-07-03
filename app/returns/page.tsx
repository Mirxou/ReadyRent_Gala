'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Package, ArrowLeft } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white" dir="rtl">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <SovereignGlow className="top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-20" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-3xl">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent">
            طلبات الإرجاع
          </h1>
          <p className="text-muted-foreground text-base">
            تتبع حالة طلبات إرجاع المنتجات المؤجرة
          </p>
        </motion.div>

        {/* Empty state card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <GlassPanel className="p-10 md:p-14 text-center relative overflow-hidden">
            {/* Decorative sparkle */}
            <SovereignSparkle className="absolute top-4 left-4 w-20 h-20 opacity-30" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gala-purple/20 to-gala-gold/10 border border-white/10 flex items-center justify-center"
            >
              <Package className="w-12 h-12 text-gala-gold/80" />
            </motion.div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              لا توجد طلبات إرجاع حالياً
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
              لم تقم بطلب إرجاع أي منتجات بعد. يمكنك تصفح المنتجات المتاحة واختيار ما يناسبك.
            </p>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-l from-gala-purple to-gala-pink text-white font-bold px-8 py-3 rounded-2xl text-sm shadow-lg shadow-gala-purple/25 hover:shadow-gala-purple/40 transition-shadow"
              >
                تصفّحي المنتجات
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          </GlassPanel>
        </motion.div>
      </div>
    </main>
  );
}