"use client";

import { useQuery } from '@tanstack/react-query';
import { disputesApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Scale, 
  ExternalLink, 
  Lock,
  ArrowRight,
  TrendingDown,
  Info,
  Database
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * SovereignLedger - The Hall of Transparency.
 * Moved to src/shared/components/sovereign/sovereign-ledger.tsx (Phase 11).
 * 
 * Principles:
 * - Public Accountability: Settled cases for community learning.
 * - Identity Protection: Hiding user specifics.
 * - Numerical Precision: Font-mono for metrics.
 */

interface DisputeCase {
  id: number;
  type: string;
  verdict: 'settled' | 'dismissed' | 'resolved';
  penalty_amount?: number;
  description_ar: string;
  resolved_at: string;
}

export function SovereignLedger() {
  const { data: disputes, isLoading } = useQuery({
    queryKey: ['public-disputes'],
    queryFn: () => disputesApi.getDisputes({ status: 'resolved', limit: 5 }).then(res => res.data),
  });

  const cases: DisputeCase[] = [
    {
       id: 1042,
       type: 'Damage Claim',
       verdict: 'settled',
       penalty_amount: 5000,
       description_ar: 'نزاع حول تلف طفيف في منطقة التطريز. حكمت المحكمة السيادية بتغطية جزئية من التأمين الخاص بالمنصة.',
       resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
       id: 985,
       type: 'Late Return',
       verdict: 'resolved',
       penalty_amount: 1200,
       description_ar: 'تأخير في تسليم القطعة لمدة 12 ساعة. تم فرض رسوم تأخير رمزية وفق الشروط التعاقدية.',
       resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
    }
  ];

  return (
    <div className="space-y-12 text-right" dir="rtl">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sovereign-gold/10 rounded-xl flex items-center justify-center border border-sovereign-gold/20">
                    <Scale className="w-6 h-6 text-sovereign-gold" />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter">سجل العدالة <span className="text-sovereign-gold">السيادية</span></h2>
             </div>
             <p className="text-sm text-white/40 italic leading-relaxed max-w-xl">
               شفافية مطلقة في فض النزاعات لضمان سيولة الثقة داخل النظام. تهدف هذه البيانات لرفع كفاءة التعامل الاجتماعي.
             </p>
          </div>
          
          <div className="flex items-center gap-8 bg-white/[0.02] p-8 rounded-[32px] border border-white/5 backdrop-blur-xl">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Settlement Rate</span>
                <div className="text-3xl font-black italic font-mono text-emerald-400">98.4%</div>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Avg. Resolution</span>
                <div className="text-3xl font-black italic font-mono text-foreground">4.2h</div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-8">
          {cases.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
            >
               <GlassPanel className="p-10 group relative overflow-hidden" variant="default" gradientBorder>
                  {/* Subtle Background Icon */}
                  <Database className="absolute -bottom-10 -left-10 w-48 h-48 text-white/[0.02] group-hover:text-sovereign-gold/[0.05] transition-all duration-1000 pointer-events-none" />
                  
                  <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                     <div className="lg:w-1/4 space-y-6">
                        <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20 px-4 py-1.5 text-[10px] font-black italic tracking-widest">
                           CASE #{item.id.toString().padStart(6, '0')}
                        </Badge>
                        <div className="space-y-2">
                           <p className="text-xs font-black text-white/40 uppercase tracking-widest">{item.type}</p>
                           <p className="text-[10px] font-bold text-white/20 tracking-[0.1em]">{format(new Date(item.resolved_at), 'dd MMM yyyy', { locale: ar })}</p>
                        </div>
                        <div className="flex items-center gap-3 text-emerald-400 font-black text-sm italic">
                           <CheckCircle2 className="w-5 h-5" />
                           {item.verdict === 'settled' ? 'تمت التسوية' : 'تم الإصدار'}
                        </div>
                     </div>

                     <div className="flex-1 space-y-8">
                        <p className="text-lg leading-relaxed text-white/80 font-medium italic rtl">
                           "{item.description_ar}"
                        </p>
                        
                        <div className="flex items-center justify-between pt-8 border-t border-white/5">
                           <div className="flex items-center gap-4">
                             <div className="p-2 bg-red-500/10 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-red-500/60" />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">إجراء مالي</span>
                                <span className="text-xl font-black font-mono text-red-500 tracking-tighter">-{item.penalty_amount?.toLocaleString()} <span className="text-xs font-normal">DA</span></span>
                             </div>
                           </div>
                           
                           <button className="h-12 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-sovereign-gold hover:border-sovereign-gold/30 transition-all flex items-center gap-3 group/btn">
                               View Evidence Proof 
                               <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                           </button>
                        </div>
                     </div>
                  </div>
               </GlassPanel>
            </motion.div>
          ))}
       </div>

       <div className="mt-12 p-10 bg-white/[0.02] rounded-[40px] border border-white/5 flex items-start gap-6">
          <div className="p-3 bg-sovereign-gold/10 rounded-2xl">
            <Info className="w-6 h-6 text-sovereign-gold/60 flex-shrink-0" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black italic tracking-tighter">ميثاق الخصوصية السيادي</h4>
            <p className="text-sm text-white/40 leading-relaxed font-medium">
              يتم عرض هذه البيانات لأدلة الشفافية والتعلم المتبادل. تم عزل هويات الأطراف المعنية طبقاً لبروتوكول 
              <span className="text-sovereign-gold text-xs mx-1">Identity Shield</span> لضمان الخصوصية التامة للعائلات المتعاملة مع منصة ReadyRent.
            </p>
          </div>
       </div>
    </div>
  );
}
