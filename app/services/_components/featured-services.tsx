'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { servicesApi } from '@/lib/api';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';
import { serviceCategories, fadeUp, staggerContainer } from './service-data';

interface FeaturedServicesProps {
  selectedCategory: string | null;
  onBookService: (service: Record<string, unknown>) => void;
}

export function FeaturedServices({ selectedCategory, onBookService }: FeaturedServicesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [services, setServices] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    servicesApi.getAll({ limit: 50 })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setServices(data);
      })
      .catch(() => setServices([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredServices = selectedCategory
    ? services.filter((s: Record<string, unknown>) => {
        const cat = serviceCategories.find((c) => c.slug === selectedCategory);
        return cat && cat.categoryMatch.includes(s.category_ar);
      })
    : services.slice(0, 6);

  return (
    <section id="services-section" ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="flex items-end justify-between mb-10 md:mb-14"
        >
          <motion.div variants={fadeUp}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">
              {selectedCategory ? 'نتائج التصفية' : 'الأفضل تقييماً'}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              {selectedCategory ? (
                <>
                  خدمات{' '}
                  <span className="text-sovereign-gold">
                    {serviceCategories.find((c) => c.slug === selectedCategory)?.name}
                  </span>
                </>
              ) : (
                <>
                  خدمات <span className="text-sovereign-gold">مميزة</span>
                </>
              )}
            </h2>
          </motion.div>
          {!selectedCategory && (
            <motion.div variants={fadeUp}>
              <Link
                href="/services"
                className="flex items-center gap-2 text-sovereign-gold text-sm font-bold hover:gap-3 transition-all"
              >
                <span>عرض الكل</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </motion.div>

        {isLoading ? (
          <DignifiedLoader label="جارٍ تحميل الخدمات..." subLabel="يرجى الانتظار قليلاً" />
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground text-lg">
              {selectedCategory ? 'لا توجد خدمات في هذا التصنيف حالياً' : 'لا توجد خدمات حالياً'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredServices.map((service: Record<string, unknown>, i: number) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
              >
                <GlassPanel
                  variant="obsidian"
                  className="overflow-hidden rounded-[2rem] hover:border-sovereign-gold/20 transition-all duration-500 h-full flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.name_ar}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      fill
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sovereign-obsidian via-transparent to-transparent" />
                    {service.is_verified && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-sovereign-gold/90 backdrop-blur-sm text-[10px] font-bold text-white">
                        موثّق
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 p-6 space-y-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-black tracking-tight hover:text-sovereign-gold transition-colors leading-tight">
                        {service.name_ar}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-sovereign-gold text-sovereign-gold" />
                        <span className="text-sm font-bold">{Number(service.rating).toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                      {service.description_ar}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{service.location}</span>
                      </div>
                      <span className="text-xs font-bold text-sovereign-gold/70">
                        {service.category_ar}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                      <SovereignButton
                        onClick={() => onBookService(service)}
                        variant="primary"
                        size="sm"
                        className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black shadow-lg shadow-sovereign-gold/10"
                      >
                        احجز الآن
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      </SovereignButton>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
