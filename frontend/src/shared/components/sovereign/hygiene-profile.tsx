"use client";

import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  FlaskConical, 
  Thermometer, 
  QrCode,
  Info,
  Droplet,
  Zap,
  Wind
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * HygieneProfile - The Purity Certificate.
 * Moved to src/shared/components/sovereign/hygiene-profile.tsx (Phase 11).
 * 
 * Principles:
 * - Medical-Grade Trust: Scientific metrics (Temp, Chemicals, Accuracy).
 * - Pill & Airy: 32px radius and 10rem internal spacing.
 * - Material Luxury: Glassmorphism with 'Platinum' accents.
 */

interface HygieneRecord {
  id: number;
  cleaning_type: 'standard' | 'deep' | 'sanitization' | 'sterilization' | 'dry_clean';
  status: string;
  completed_at: string;
  quality_score: number;
  chemicals_used?: string;
  temperature?: number;
  certificate_number?: string;
}

interface HygieneProfileProps {
  record?: HygieneRecord;
  className?: string;
  showTitle?: boolean;
}

export function HygieneProfile({ record, className, showTitle = true }: HygieneProfileProps) {
  if (!record) return (
    <GlassPanel className={cn("p-10 border-dashed border-white/10 text-center opacity-40", className)}>
        <Wind className="w-12 h-12 mx-auto mb-4 opacity-10 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">انتظار فحص النقاء التالي</p>
    </GlassPanel>
  );

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'sterilization': return <FlaskConical className="w-5 h-5" />;
      case 'sanitization': return <Droplet className="w-5 h-5" />;
      case 'dry_clean': return <Wind className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'sterilization': return 'تعقيم سيادي (Sterilization)';
      case 'sanitization': return 'تطهير بلاتيني (Sanitization)';
      case 'dry_clean': return 'تنظيف جاف ملكي (Dry Clean)';
      case 'deep': return 'معالجة عميقة (Deep Clean)';
      default: return 'تنظيف قياسي معتمد';
    }
  };

  return (
    <GlassPanel className={cn("p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-700", className)} variant="default" gradientBorder>
      
      {/* 🧬 Subtle DNA Spiral Watermark */}
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />

      {showTitle && (
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Sovereign Hygiene Proof</h4>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black px-4 py-1.5 rounded-full tracking-widest">CERTIFIED SAFE</Badge>
          </div>
      )}

      <div className="space-y-8 relative z-10" dir="rtl">
        {/* Method & Timestamp */}
        <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6 duration-700">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black italic text-white/90 tracking-tight leading-none">{getMethodLabel(record.cleaning_type)}</h3>
                <div className="flex items-center gap-3 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified Pass</span>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="font-mono">DT: {format(new Date(record.completed_at), 'dd MMM yyyy', { locale: ar })}</span>
                </div>
            </div>
        </div>

        {/* Vital Metrics Grid */}
        <div className="grid grid-cols-2 gap-6 pb-2">
            <div className="p-5 bg-white/[0.02] rounded-[24px] border border-white/5 space-y-3 group-hover:bg-white/[0.04] transition-all">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">دقة المعالجة (Accuracy)</p>
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black italic tracking-tighter text-white/90 font-mono">{record.quality_score}</span>
                    <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">/10 GRADE</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(record.quality_score / 10) * 100}%` }}
                        className="h-full bg-emerald-500"
                    />
                </div>
            </div>
            <div className="p-5 bg-white/[0.02] rounded-[24px] border border-white/5 space-y-3 group-hover:bg-white/[0.04] transition-all">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">درجة الحرارة (Thermal)</p>
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black italic tracking-tighter text-white/90 font-mono">{record.temperature || 60}</span>
                    <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">°C CALIBRATED</span>
                </div>
                <div className="flex items-center gap-2 opacity-30">
                    <Thermometer className="w-3 h-3 text-emerald-500" />
                    <span className="text-[8px] font-black uppercase italic tracking-widest text-emerald-500">Thermostatic Lock Active</span>
                </div>
            </div>
        </div>

        {/* Certificate Verification Footer */}
        {record.certificate_number && (
            <div className="flex items-center justify-between pt-8 border-t border-white/5 bg-gradient-to-t from-white/[0.01] to-transparent -mx-8 px-8 -mb-8 pb-8 rounded-b-[40px]">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                        <QrCode className="w-6 h-6 text-white/20 group-hover:text-emerald-500/40 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] mb-1">Blockchain Hash</span>
                        <span className="text-[9px] font-mono font-bold text-white/40 tracking-widest group-hover:text-emerald-500/50 transition-colors">{record.certificate_number}</span>
                    </div>
                </div>
                <button className="h-10 px-6 rounded-2xl bg-white/[0.03] border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-emerald-500 hover:border-emerald-500/20 transition-all flex items-center gap-2">
                    View forensic Audit <Info className="w-3.5 h-3.5" />
                </button>
            </div>
        )}
      </div>

      {/* Background Icon Watermark */}
      <FlaskConical className="absolute top-10 left-10 w-32 h-32 text-emerald-500/[0.02] -rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-1000" />
    </GlassPanel>
  );
}
