'use client';

import { motion } from 'framer-motion';
import { ProductSearch } from '@/components/product/product-search';
import { ParticleField } from '@/components/ui/particle-field';
import { BookingWizard } from '@/components/booking/booking-wizard';

export default function ProductsPage() {
  return (
    <div className="relative min-h-screen bg-gray-50/50">
      <ParticleField />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 
            className="text-6xl md:text-8xl font-black mb-6 tracking-tighter"
            style={{
              background: 'linear-gradient(to bottom right, #111827, #374151)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            كتالوج 2026
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            اكتشف نخبة المنتجات المختارة بعناية لتناسب أرقى المناسبات في الجزائر.
          </p>
        </motion.div>

        <ProductSearch />
      </div>

      <BookingWizard />
    </div>
  );
}
