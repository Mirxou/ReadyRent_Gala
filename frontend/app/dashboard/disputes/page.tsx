"use client";

import { useQuery } from '@tanstack/react-query';
import { disputesApi } from '@/lib/api';
import { 
  Scale, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  History,
  ShieldCheck,
  ChevronRight,
  Loader2,
  FileText
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DisputesPage() {
  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => disputesApi.getDisputes().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-sovereign-gold" />
        <span className="text-xs font-black uppercase tracking-widest opacity-40">Accessing Arbitration Records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 text-right" dir="rtl">
      
      {/* Header */}
      <div className="space-y-4">
        <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
            Arbitration & Resolution
        </Badge>
        <h1 className="text-5xl font-black tracking-tighter text-foreground">
            مركز التحكيم والنزاعات<span className="text-sovereign-gold">.</span>
        </h1>
        <p className="text-muted-foreground font-light leading-relaxed max-w-2xl">
            سجل طلبات مراجعة العقود وفض النزاعات القائمة تحت مظلة ميثاق STANDARD.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main List (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
            {disputes.length > 0 ? (
                disputes.map((dispute: any) => (
                    <GlassPanel key={dispute.id} className="p-8 group hover:border-sovereign-gold/20 transition-all duration-500 overflow-hidden relative" gradientBorder>
                         <div className="flex flex-col md:flex-row gap-8 relative z-10">
                            
                            {/* Icon Indicator */}
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                                {dispute.status === 'resolved' ? (
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                ) : (
                                    <Clock className="w-8 h-8 text-sovereign-gold animate-pulse" />
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-foreground flex items-center gap-3 tracking-tight">
                                           {dispute.title || `نزاع العقد #ST-${dispute.booking_id}`}
                                           <Badge className={cn(
                                               "px-3 py-0.5 text-[10px] font-black uppercase border-0 rounded-full",
                                               dispute.status === 'open' ? "bg-yellow-500/10 text-yellow-500" :
                                               dispute.status === 'resolved' ? "bg-emerald-500/10 text-emerald-500 shadow-sm shadow-emerald-500/10" :
                                               "bg-blue-500/10 text-blue-500"
                                           )}>
                                               {dispute.status}
                                           </Badge>
                                        </h3>
                                        <p className="text-xs text-muted-foreground opacity-60">سبب التحكيم: {dispute.reason}</p>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-mono bg-white/5 px-3 py-1 rounded-md">
                                        REF: ARB-{dispute.id.toString().padStart(6, '0')}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <span className="flex items-center gap-2"><Clock className="w-3 h-3 text-sovereign-gold" /> قيد المراجعة</span>
                                        <span className="flex items-center gap-2"><Scale className="w-3 h-3 text-sovereign-gold" /> خُبراء سياديون</span>
                                    </div>
                                    
                                    <Link href={`/dashboard/disputes/${dispute.id}`}>
                                        <SovereignButton variant="secondary" size="sm" className="gap-2 px-6">
                                            متابعة القضية <ChevronRight className="w-4 h-4" />
                                        </SovereignButton>
                                    </Link>
                                </div>
                            </div>
                         </div>
                    </GlassPanel>
                ))
            ) : (
                <GlassPanel className="p-20 text-center flex flex-col items-center justify-center border-dashed border-white/10 bg-transparent min-h-[400px]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                        <Scale className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">لا توجد نزاعات قانونية</h3>
                    <p className="text-muted-foreground/60 max-w-sm font-light text-lg">
                        جميع عقودك السيادية تسير بسلام وفق ميثاق الثقة.
                    </p>
                </GlassPanel>
            )}
        </div>

        {/* Sidebar: Legal Context (Span 4) */}
        <div className="lg:col-span-4 space-y-8">
            <GlassPanel className="p-8 space-y-6" gradientBorder>
                <h3 className="text-lg font-black flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-sovereign-gold" /> حماية STANDARD
                </h3>
                <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-xs font-black uppercase text-sovereign-gold mb-1">متوسط وقت الحل</p>
                        <p className="text-lg font-black">4 ساعات عمل</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-xs font-black uppercase text-emerald-500 mb-1">نسبة النجاح</p>
                        <p className="text-lg font-black">98.4% تسوية ودية</p>
                    </div>
                </div>
                <Separator className="bg-white/5" />
                <p className="text-[10px] text-muted-foreground font-light leading-relaxed">
                    يعمل المحكمون السياديون على مراجعة الأدلة الرقمية والعقود لضمان حق المالك والمستأجر دون الحاجة لتدخل بشري معقد في 90% من الحالات.
                </p>
            </GlassPanel>

            <GlassPanel className="p-8 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">وثائق هامة</h4>
                <div className="space-y-2">
                    <SovereignButton variant="secondary" className="w-full justify-start gap-3 h-12 text-xs">
                        <FileText className="w-4 h-4" /> ميثاق التحكيم السيادي
                    </SovereignButton>
                    <SovereignButton variant="secondary" className="w-full justify-start gap-3 h-12 text-xs">
                        <Scale className="w-4 h-4" /> شروط حل النزاعات
                    </SovereignButton>
                </div>
            </GlassPanel>
        </div>
      </div>
    </div>
  );
}
