'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { serviceCategories, fadeUp, staggerContainer } from './service-data';

interface ServiceCategoriesGridProps {
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

export function ServiceCategoriesGrid({ selectedCategory, onSelectCategory }: ServiceCategoriesGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 md:mb-14 gap-4"
        >
          <motion.div variants={fadeUp}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400/60 mb-3">دليل الخدمات</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
              أصناف <span className="text-purple-400">الخدمات</span>
            </h2>
          </motion.div>
          {selectedCategory && (
            <motion.div variants={fadeUp}>
              <button
                onClick={() => onSelectCategory(null)}
                className="flex items-center gap-2 text-purple-400 text-sm font-bold hover:gap-3 transition-all"
              >
                <span>عرض الكل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {serviceCategories.map((cat, i) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
              >
                <button
                  onClick={() => onSelectCategory(isActive ? null : cat.slug)}
                  className="block group h-full w-full text-right"
                >
                  <div
                    className={`relative p-5 md:p-6 rounded-[2rem] border backdrop-blur-sm transition-all duration-500 text-center h-full ${
                      isActive
                        ? 'border-purple-400/40 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : 'border-white/5 bg-gradient-to-br ' + cat.gradient + ' hover:border-purple-400/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div
                        className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${
                          isActive
                            ? 'bg-purple-400/20 text-purple-300'
                            : 'bg-purple-400/10 text-purple-400'
                        }`}
                      >
                        <cat.icon className="w-6 h-6" />
                      </div>
                      <h3
                        className={`text-sm md:text-base font-black tracking-tight transition-colors ${
                          isActive ? 'text-purple-300' : 'group-hover:text-purple-400'
                        }`}
                      >
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 hidden sm:block">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
