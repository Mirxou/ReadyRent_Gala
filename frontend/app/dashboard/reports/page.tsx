"use client";

import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Share2, 
  Sparkles, 
  BrainCircuit, 
  TrendingUp, 
  ShieldCheck,
  Quote,
  Layers,
  Search,
  BookOpen,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Globe2,
  Info
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SovereignPredictivePulse } from '@/features/analytics/components/predictive-pulse';
import { SovereignConcierge } from '@/shared/components/sovereign/sovereign-concierge';
import { useQuery } from '@tanstack/react-query';
import { intelligenceApi } from '@/lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

/**
 * ReportsPage - The Sovereign Intelligence Hub.
 * Phase 11: Sovereign Mastery (McKinsey Standard).
 * 
 * Features:
 * - Strategic Analysis Preview with High-Fidelity Data.
 * - Multi-format Export (PDF/PPTX) Simulations.
 * - Regional Market Breakdown (DZ Focus - Algiers, Oran, Constantine).
 * - Airy Layout: 64px section gaps, 40px internal margins.
 */

export default function ReportsPage() {
    const { data: regionalData, isLoading: isLoadingRegional } = useQuery({
        queryKey: ['regional-liquidity'],
        queryFn: () => intelligenceApi.getRegionalLiquidity().then(res => res.data),
    });

    const { data: intelligencePulse, isLoading: isLoadingPulse } = useQuery({
        queryKey: ['intelligence-pulse'],
        queryFn: () => intelligenceApi.getPulse().then(res => res.data),
    });

    const { data: report, isLoading: isLoadingReport } = useQuery({
        queryKey: ['market-report'],
        queryFn: () => intelligenceApi.getMarketReport().then(res => res.data),
    });

    const handleDownload = (format: string) => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: `جاري توليد التقرير الاستراتيجي بصيغة ${format}...`,
                success: `تم تجهيز التقرير! السيادة الرقمية بانتظارك.`,
                error: 'عذراً، حدث خطأ في بروتوكول التوليد.',
            }
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-[64px] pb-[120px]"
            dir="rtl"
        >
            {/* 1. Elite Header: The Hub of Authority */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 px-[40px]">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-sovereign-gold/10 rounded-[24px] border border-sovereign-gold/20 shadow-2xl shadow-sovereign-gold/10">
                            <BookOpen className="w-10 h-10 text-sovereign-gold" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-6xl font-black italic tracking-tighter leading-none">فضاء <span className="text-sovereign-gold">الاستخبارات</span></h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Sovereign Intelligence Unit / V.11</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <SovereignButton variant="secondary" size="lg" className="px-10 h-14 rounded-full border-white/5 bg-white/[0.02]">
                        الأرشيف السيادي <Search className="mr-3 w-4 h-4 opacity-40" />
                    </SovereignButton>
                    <SovereignButton variant="primary" size="lg" className="px-10 h-14 shadow-2xl rounded-full" withShimmer>
                        توليد تقرير (Protocol) <Sparkles className="mr-3 w-4 h-4" />
                    </SovereignButton>
                </div>
            </div>

            {/* 2. McKinsey Style Main Section */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-[64px] px-[40px]">
                
                {/* Left: Section Navigation & Key Metrics (Sidebar) */}
                <div className="xl:col-span-3 space-y-10">
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 px-4">الفهرس الاستراتيجي</h4>
                        <div className="flex flex-col gap-2">
                             {['مقدمة سيادية', 'اتجاهات 2026', 'تحليل السيولة الإقليمي', 'خارطة المخاطر', 'توصيات النخبة'].map((item, i) => (
                                <button key={i} className="flex items-center justify-between p-5 rounded-[24px] hover:bg-white/5 transition-all group text-right">
                                    <span className={cn("text-sm font-black italic transition-all", i === 1 ? "text-sovereign-gold" : "text-white/30 group-hover:text-white/60")}>{item}</span>
                                    <ChevronRight className={cn("w-4 h-4 transition-all text-sovereign-gold", i === 1 ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
                                </button>
                             ))}
                        </div>
                    </div>

                    <GlassPanel className="p-10 space-y-8 rounded-[40px]" variant="obsidian">
                        <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">دقة التحليل الجهازي</span>
                            <div className="flex items-baseline gap-2">
                                <div className="text-5xl font-black italic tracking-tighter text-white">99.2</div>
                                <div className="text-lg font-black text-sovereign-gold">%</div>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '99.2%' }}
                                transition={{ duration: 2, delay: 0.5 }}
                                className="h-full bg-sovereign-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" 
                            />
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <BrainCircuit className="w-5 h-5 text-sovereign-gold" />
                            <p className="text-[9px] text-white/30 leading-relaxed font-black uppercase tracking-widest italic">
                                Verified by Oracle Core V.10
                            </p>
                        </div>
                    </GlassPanel>
                </div>

                {/* Center: The Masterpiece Report Preview */}
                <div className="xl:col-span-9 space-y-16">
                    <GlassPanel className="p-0 border-white/5 group relative rounded-[48px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]" variant="default" gradientBorder>
                         {/* Report Hero (Cover Page Style) */}
                         <div className="p-16 lg:p-24 border-b border-white/5 bg-gradient-to-br from-sovereign-gold/[0.08] via-transparent to-transparent relative">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-sovereign-gold/5 rounded-full blur-[120px] pointer-events-none" />
                            
                            <div className="flex flex-col md:flex-row justify-between items-start gap-16 relative z-10">
                                <div className="space-y-8 max-w-3xl">
                                    <Badge className="bg-sovereign-obsidian text-sovereign-gold border-sovereign-gold/30 px-6 py-2.5 text-[10px] font-black tracking-[0.4em] uppercase rounded-full">
                                        Executive Briefing 26-Q1 / DZ
                                    </Badge>
                                    <h2 className="text-6xl lg:text-7xl font-black italic tracking-tighter leading-[0.85] text-white/95">
                                        {report?.title || "آفاق الاقتصاد السيادي: النمو غير العضوي"}: <span className="text-sovereign-gold">النمو غير العضوي</span> في سوق الأصول الجزائري.
                                    </h2>
                                    <div className="flex items-center gap-8 pt-4">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Protocol: STANDARD CORE</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Globe2 className="w-5 h-5 text-sovereign-gold" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Region: ALGERIA_CENTRAL</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 min-w-[240px]">
                                    <SovereignButton variant="primary" onClick={() => handleDownload('PDF')} className="w-full h-16 rounded-full font-black text-xs shadow-2xl" withShimmer>
                                        تصدير بصيغة PDF <Download className="mr-3 w-5 h-5" />
                                    </SovereignButton>
                                    <SovereignButton variant="secondary" onClick={() => handleDownload('PPTX')} className="w-full h-16 rounded-full font-black text-xs border-white/10 hover:bg-white/5">
                                        تقرير تقديمي PPTX <Share2 className="mr-3 w-5 h-5" />
                                    </SovereignButton>
                                </div>
                            </div>
                         </div>

                         {/* Report Content Body (Airy Spacing) */}
                         <div className="p-16 lg:p-24 space-y-[96px]">
                            
                            {/* Section 1: Executive Summary */}
                            <section className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black uppercase tracking-[0.5em] text-sovereign-gold italic leading-none">1.0 ملخص تنفيذي</h3>
                                        <div className="h-[2px] w-12 bg-sovereign-gold/30" />
                                    </div>
                                    <div className="p-8 bg-white/[0.02] border-r-[6px] border-sovereign-gold rounded-[32px] relative overflow-hidden group/quote">
                                        <Quote className="absolute -top-4 -right-4 w-16 h-16 text-sovereign-gold/5 fill-current group-hover/quote:scale-110 transition-transform duration-700" />
                                        <p className="text-2xl font-black italic leading-tight text-white/90 relative z-10">
                                            "نشهد تعميد فئة جديدة من 'الأصول المنتجة' في الجزائر، حيث يتم تحويل الملكية الخاصة إلى قوة اقتصادية سيادية."
                                        </p>
                                    </div>
                                </div>
                                <div className="lg:col-span-8 space-y-8 text-white/40 leading-[1.8] font-medium text-right text-lg italic">
                                    <p>
                                        {report?.summary || 'تؤكد مؤشرات "سيولة الثقة" (Trust Liquidity) لعام 2026 أن السوق الجزائري قد انتقل لمرحلة "النضج الرقمي السيادي". الطلب المتزايد على الأصول الموثقة يثبت أن الأمان القائم على AI هو المحرك الأول حالياً.'}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                                        {[
                                            { t: 'نمو السيولة الرقمية', v: report?.metrics?.liquidity_growth || '+42%', d: 'ولايات الجزائر الكبرى' },
                                            { t: 'انخفاض نسبة المخاطرة', v: report?.metrics?.risk_reduction || '2.4%', d: 'أدنى مستوى تاريخي' }
                                        ].map((stat, i) => (
                                            <div key={i} className="p-8 bg-white/[0.01] border border-white/5 rounded-[24px] space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{stat.t}</p>
                                                <div className="text-4xl font-black text-white italic">{stat.v}</div>
                                                <p className="text-[9px] font-black text-sovereign-gold/40">{stat.d}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Regional Liquidity Visualization */}
                            <section className="space-y-16 pt-16 border-t border-white/5">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.5em] text-sovereign-gold italic leading-none">2.0 تحليل السيولة الجهوي</h3>
                                        <h4 className="text-3xl font-black italic tracking-tighter">تركز الثقة في الولايات الرئيسية</h4>
                                    </div>
                                    <Badge className="bg-white/5 text-white/30 border-white/10 px-6 py-2 rounded-full text-[9px] font-black tracking-widest italic">GEOSPATIAL PULSE</Badge>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                                    <div className="lg:col-span-8 h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={regionalData || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                <XAxis 
                                                    dataKey="name" 
                                                    stroke="#ffffff20" 
                                                    fontSize={12} 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    dy={20}
                                                    fontFamily="var(--font-ibm-plex)"
                                                />
                                                <YAxis hide />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(197,160,89,0.2)', borderRadius: '16px' }}
                                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                />
                                                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                                                    {regionalData?.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="lg:col-span-4 space-y-8 p-10 bg-white/[0.01] rounded-[40px] border border-white/5 self-start">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-sovereign-gold">
                                                <Info className="w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">رؤية استراتيجية</span>
                                            </div>
                                            <p className="text-base font-black italic leading-relaxed text-white/70">
                                                تتصدر العاصمة مؤشرات السيولة، لكننا نلاحظ قفزة نوعية في "وهران" نتيجة لتوسع الاستثمارات اللوجستية في المنطقة الغربية.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-[2px] w-full bg-white/5 overflow-hidden rounded-full">
                                                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-sovereign-gold" />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                                                <span>Alger Hub Accuracy</span>
                                                <span className="text-sovereign-gold">High Density</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Predictive Pulse Integrated */}
                            <section className="space-y-16 pt-16 border-t border-white/5">
                                <div className="space-y-4">
                                     <h3 className="text-xs font-black uppercase tracking-[0.5em] text-sovereign-gold italic leading-none">3.0 نبض التنبؤ الاستشرافي</h3>
                                     <p className="text-base text-white/40 italic font-medium">التمثيل البصري للقيم السوقية المتوقعة وتدفقات السيولة في الستة أشهر القادمة.</p>
                                </div>
                                <SovereignPredictivePulse />
                                <div className="p-10 bg-sovereign-gold/5 border border-sovereign-gold/20 rounded-[40px] flex flex-col md:flex-row items-center gap-10">
                                    <div className="w-16 h-16 rounded-[20px] bg-sovereign-gold flex items-center justify-center text-sovereign-obsidian shrink-0">
                                        <BrainCircuit className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black italic tracking-tighter text-sovereign-gold leading-none">توصية الأوراكل السيادي</h4>
                                        <p className="text-sm font-bold text-white/60 leading-relaxed italic">
                                            "ننصح المستثمرين وأصحاب الأصول بتركيز العرض في فئة 'الأزياء التقليدية الفاخرة' و 'الإلكترونيات المرموقة' خلال موسم الربيع القادم لتغطية الفجوة المتوقعة في الطلب الجهوي."
                                        </p>
                                    </div>
                                </div>
                            </section>

                         </div>

                         {/* McKinsey Style Footer (Watermarked) */}
                         <div className="p-12 border-t border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-10">
                             <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] italic">Confidential | Standard Sovereign Intelligence Hub</div>
                             <div className="flex gap-12 text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic">
                                 <span className="flex items-center gap-2"><BarChart3 className="w-3 h-3" /> Report ID: RR-DZ-Q1-2026</span>
                                 <span>Security: Forensic Level 4</span>
                                 <span className="text-white/60">Page: 01 / 24</span>
                             </div>
                         </div>
                    </GlassPanel>
                </div>

            </div>

            {/* 🤖 GLOBAL CONCIERGE */}
            <SovereignConcierge />
        </motion.div>
    );
}
