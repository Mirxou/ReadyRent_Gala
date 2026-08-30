'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { formatNumber } from '@/lib/utils';
import { type SubscriptionHistory, fadeUp, staggerContainer } from './types';
import { toast } from 'sonner';

interface HistorySectionProps {
  history: SubscriptionHistory[];
}

const statusStyles: Record<string, string> = {
  مدفوع: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  نشط: 'bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20',
  ملغي: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function formatAmount(amount: number) {
  return amount === 0 ? 'مجاني' : `${formatNumber(amount)} دج`;
}

export function HistorySection({ history }: HistorySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-10 md:py-16 px-4 pb-24 md:pb-32">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={staggerContainer} className="mb-8">
          <motion.p variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold/60 mb-3">السجل</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">
            سجل <span className="text-sovereign-gold">المدفوعات</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
        >
          <GlassPanel variant="obsidian" className="rounded-[2rem] p-4 md:p-6">
            <div className="relative z-10">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['التاريخ', 'الخطة', 'المبلغ', 'الحالة', 'الفاتورة'].map((h) => (
                        <th key={h} className="text-right py-4 px-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry, i) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-3 text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-4 px-3 font-bold">{entry.plan}</td>
                        <td className="py-4 px-3 text-sovereign-gold font-bold">{formatAmount(entry.amount)}</td>
                        <td className="py-4 px-3">
                          <Badge className={`${statusStyles[entry.status] || ''} border text-[10px] font-bold px-2.5 py-0.5`}>{entry.status}</Badge>
                        </td>
                        <td className="py-4 px-3">
                          <button
                            className="flex items-center gap-1.5 text-sovereign-gold/60 hover:text-sovereign-gold transition-colors text-xs font-bold"
                            onClick={() => toast.info('الفاتورة غير متاحة حالياً')}
                          >
                            <FileText className="w-3.5 h-3.5" /> عرض
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden max-h-96 overflow-y-auto space-y-3 scrollbar-thin">
                {history.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold">{entry.plan}</span>
                      <Badge className={`${statusStyles[entry.status] || ''} border text-[10px] font-bold px-2.5 py-0.5`}>{entry.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{new Date(entry.date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span className="text-sovereign-gold font-bold">{formatAmount(entry.amount)}</span>
                    </div>
                    <button
                      className="mt-3 flex items-center gap-1.5 text-sovereign-gold/60 hover:text-sovereign-gold transition-colors text-xs font-bold"
                      onClick={() => toast.info('الفاتورة غير متاحة حالياً')}
                    >
                      <FileText className="w-3.5 h-3.5" /> عرض الفاتورة
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
