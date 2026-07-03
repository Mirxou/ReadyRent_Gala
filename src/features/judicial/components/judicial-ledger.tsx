"use client";

import { useQuery } from '@tanstack/react-query';
import { judicialApi, disputesApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gavel, 
  ShieldCheck, 
  Scale, 
  History, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * JudicialLedger - The Sovereign Transparency Hub.
 * Phase 13: Mastery Finalization.
 * 
 * Features:
 * - Public Judgment Ledger (De-identified).
 * - User-Specific Dispute Tracking.
 * - Global Trust Metrics (Algerian Market).
 */

export function JudicialLedger() {
  // 1. Fetch Public Transparency Data
  const { data: publicJudgments, isLoading: isLoadingPublic } = useQuery({
    queryKey: ['public-judgments'],
    queryFn: () => judicialApi.getPublicLedger().then(res => res.data),
    refetchInterval: 60000,
  });

  // 2. Fetch User's Active Disputes (From disputesApi as per api.ts)
  const { data: myDisputes, isLoading: isLoadingPrivate } = useQuery({
    queryKey: ['my-disputes'],
    queryFn: () => disputesApi.getDisputes().then(res => res.data),
  });

  // 3. Status Badge Color Mapper
  const statusColors: any = {
    'filed': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'under_review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'judgment_provisional': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'closed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="space-y-[64px]" dir="rtl">
      
      {/* --- ELITE HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-sovereign-gold/10 rounded-[24px] border border-sovereign-gold/20 shadow-2xl">
              <Scale className="w-10 h-10 text-sovereign-gold" />
            </div>
            <div className="space-y-1">
              <h2 className="text-4xl font-black italic tracking-tighter leading-none">سجل <span className="text-sovereign-gold">العدالة</span> السيادي</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Public Transparency Ledger / Algex-V.1</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">مؤشر النزاهة</span>
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-2xl font-black italic text-white/90">99.8%</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* --- LEFT SIDE: PUBLIC LEDGER --- */}
        <div className="xl:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-3">
                    <Eye className="w-4 h-4 text-sovereign-gold" />
                    الأحكام العامة الموثقة
                </h3>
                <Badge variant="outline" className="text-[9px] border-white/5 text-white/20">PUBLIC RECORDS</Badge>
            </div>

            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {publicJudgments?.map((judgment: any, i: number) => (
                        <motion.div
                            key={judgment.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                        >
                            <GlassPanel className="p-8 group relative overflow-hidden transition-all duration-700 hover:bg-white/[0.03]" variant="default">
                                <div className="absolute top-0 left-0 w-2 h-full bg-sovereign-gold/20 group-hover:bg-sovereign-gold transition-colors" />
                                
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-white/5 text-white/40 border-white/10 px-3 py-1 text-[9px] font-black">
                                                ID: JUD-{String(judgment.id).padStart(4, '0')}
                                            </Badge>
                                            <span className="text-[10px] text-white/20 font-bold italic">
                                                {format(new Date(judgment.judgment_date), 'dd MMMM yyyy', { locale: ar })}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-black italic text-white/90 group-hover:text-white transition-colors">
                                            نزاع حول {judgment.dispute_type || 'أصول سيادية'}
                                        </h4>
                                        <p className="text-sm text-white/40 leading-relaxed italic max-w-2xl line-clamp-2">
                                            {judgment.ruling_summary}
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-col items-end justify-between min-w-[140px]">
                                        <Badge className={cn("px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest", judgment.verdict === 'full_refund' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sovereign-gold/10 text-sovereign-gold')}>
                                            {judgment.verdict.toUpperCase().replace('_', ' ')}
                                        </Badge>
                                        <SovereignButton variant="secondary" size="sm" className="h-10 px-4 mt-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full border-white/5">
                                            عرض التفاصيل <ChevronRight className="mr-2 w-4 h-4 ml-0" />
                                        </SovereignButton>
                                    </div>
                                </div>
                            </GlassPanel>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {(!publicJudgments || publicJudgments.length === 0) && !isLoadingPublic && (
                    <div className="p-20 text-center opacity-20 space-y-4">
                        <FileText className="w-16 h-16 mx-auto" />
                        <p className="font-black uppercase tracking-widest text-xs italic">لا توجد سجلات عامة في الأرشيف حالياً</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- RIGHT SIDE: MY DISPUTES --- */}
        <div className="xl:col-span-4 space-y-8">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-3">
                    <Gavel className="w-4 h-4 text-sovereign-gold" />
                    نزاعاتي النشطة
                </h3>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">MY CASE</Badge>
            </div>

            <div className="space-y-6">
                {myDisputes?.map((caseItem: any) => (
                    <GlassPanel key={caseItem.id} className="p-6 border-white/5 relative group rounded-[32px]" variant="obsidian" gradientBorder>
                         <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                                    statusColors[caseItem.status] || 'bg-white/5 text-white/40 border-white/10'
                                )}>
                                    {caseItem.status.replace('_', ' ')}
                                </span>
                                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[8px]">
                                    {caseItem.priority.toUpperCase()}
                                </Badge>
                            </div>
                            
                            <div className="space-y-1">
                                <h5 className="font-black text-white/90 text-sm italic">{caseItem.title}</h5>
                                <p className="text-[10px] text-white/30 font-medium">آخر تحديث: {format(new Date(caseItem.updated_at), 'HH:mm - dd/MM', { locale: ar })}</p>
                            </div>

                            <SovereignButton variant="primary" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest mt-2 rounded-full">
                                متابعة الجلسة <ExternalLink className="mr-2 w-3 h-3" />
                            </SovereignButton>
                         </div>
                    </GlassPanel>
                ))}

                {(!myDisputes || myDisputes.length === 0) && !isLoadingPrivate && (
                    <GlassPanel className="p-12 text-center border-dashed border-white/5 rounded-[40px]" variant="default">
                        <div className="space-y-4 opacity-30">
                            <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500" />
                            <div className="space-y-1">
                                <p className="text-xs font-black italic">حسابك في حالة امتثال تامة</p>
                                <p className="text-[9px] font-medium">لا توجد بلاغات أو نزاعات تجارية نشطة.</p>
                            </div>
                        </div>
                    </GlassPanel>
                )}

                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[40px] space-y-6">
                    <div className="flex items-center gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <h6 className="text-[10px] font-black uppercase tracking-widest leading-none">بروتوكول التصعيد</h6>
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed font-medium italic">
                        إذا واجهت مشكلة في عملية الإيجار، يمكنك بدء "نزاع سيادي" (Sovereign Dispute) خلال 48 ساعة من وقوع الحادثة لضمان استرداد الحقوق.
                    </p>
                    <SovereignButton variant="secondary" className="w-full h-12 border-white/10 hover:bg-white/5 text-[9px] font-black uppercase rounded-full">
                        بدأ بلاغ جديد
                    </SovereignButton>
                </div>
            </div>
        </div>

      </div>

    </div>
  );
}
