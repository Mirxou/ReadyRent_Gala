"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  Lock, 
  History, 
  AlertTriangle,
  RefreshCw,
  Cpu,
  Fingerprint,
  FileCode,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { disputesApi } from '@/lib/api';
import { toast } from 'sonner';

/**
 * HighCourtMonitor - The Forensic Audit Console.
 * Moved to src/features/judicial/components/high-court-monitor.tsx (Phase 11).
 * 
 * Principles:
 * - Cryptographic Proof-of-Truth: Real-time integrity checks.
 * - Forensic Density: Multi-metric dashboards.
 * - Pill & Airy: 32px-40px radius and 12rem section spacing.
 */

export function HighCourtMonitor() {
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  const performAudit = useCallback(async () => {
    setLoading(true);
    try {
      // Note: Endpoint from disputesApi (Vault Integrity)
      const res = await (disputesApi as any).getVaultIntegrity();
      setAudit(res.audit);
      setLastScan(new Date());
      if (!res.audit.is_valid) {
         toast.error("تنبيه سيادي: تم كشف خرق في تسلسل الحقيقة!", {
           description: "تم اكتشاف تلاعب خارجي في أحد سجلات الأدلة المحمية.",
           duration: 10000
         });
      }
    } catch (err) {
      toast.error("فشل في الوصول إلى خوادم المحكمة العليا الرقمية.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { performAudit(); }, [performAudit]);

  const healthPercentage = audit ? (audit.verified_count / audit.total_count) * 100 : 0;
  const isValid = audit?.is_valid;

  return (
    <div className="space-y-12" dir="rtl">
      
      {/* 1. Forensic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-8">
         <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sovereign-gold/10 rounded-xl flex items-center justify-center border border-sovereign-gold/20 shadow-2xl">
                    <Fingerprint className="w-6 h-6 text-sovereign-gold" />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter">المحكمة العليا <span className="text-white/20">/</span> مراقب النزاهة</h2>
            </div>
            <p className="text-sm text-white/40 italic leading-relaxed max-w-xl">
               التدقيق الفوري لسلسلة الحقيقة المشفرة (Proof-of-Truth). ضمان استحالة التلاعب ببيانات النزاعات.
            </p>
         </div>
         
         <div className="flex gap-4 items-center">
            <SovereignButton 
                onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/disputes/admin/vault/certificate/`, '_blank')}
                variant="secondary"
                className="h-14 px-8 rounded-full text-[10px] font-black uppercase tracking-widest"
            >
                <Database className="w-4 h-4 ml-3 opacity-40" />
                تصدير الشهادة
            </SovereignButton>
            <SovereignButton 
                onClick={performAudit} 
                isLoading={loading}
                variant="primary"
                className="h-14 px-8 rounded-full"
                withShimmer
            >
                <RefreshCw className={cn("w-4 h-4 ml-3", loading && "animate-spin")} />
                تحديث الفحص الراداري
            </SovereignButton>
         </div>
      </div>

      {/* 2. Primary Forensic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* 🛡️ Chain Health Card */}
        <GlassPanel className="p-8 relative overflow-hidden group border-white/5" variant="obsidian" gradientBorder>
           <div className="absolute top-0 right-0 w-48 h-48 bg-sovereign-gold/5 rounded-full blur-[80px] -mr-24 -mt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
           
           <div className="flex items-start justify-between relative z-10">
              <div className="space-y-6">
                 <div className="w-16 h-16 bg-white/[0.03] rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl transition-transform group-hover:scale-110 duration-700">
                    <ShieldCheck className={cn("w-8 h-8", isValid ? "text-emerald-400" : "text-red-500")} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">صحة سلسلة الأدلة</p>
                    <h4 className="text-5xl font-black italic tracking-tighter font-mono">{healthPercentage.toFixed(1)}%</h4>
                 </div>
              </div>
              
              <Badge className={cn(
                  "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-0 transition-all duration-700",
                  isValid ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-red-500/10 text-red-500 animate-pulse"
              )}>
                  {isValid ? "VALIDATED" : "BREACH DETECTED"}
              </Badge>
           </div>

           <div className="mt-12 space-y-4 relative z-10">
              <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 p-0.5">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${healthPercentage}%` }}
                    transition={{ duration: 2, ease: [0.32, 0.72, 0, 1] }}
                    className={cn("h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]", isValid ? "bg-emerald-500" : "bg-red-500")}
                 />
              </div>
              <p className="text-[10px] text-white/20 italic font-medium">تم مراجعة وتعريف {audit?.total_count || 0} سجل مشفر في الكتلة الأخيرة.</p>
           </div>
        </GlassPanel>

        {/* 📊 Truth Pulse (Dynamic Visualization) */}
        <GlassPanel className="p-8 border-white/5 group" variant="default">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <Activity className="w-4 h-4 text-sovereign-gold animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">النبض الرقمي (Truth Pulse)</span>
              </div>
              <Badge className="bg-white/5 text-white/20 border-0 text-[8px] italic">LIVE</Badge>
           </div>

           <div className="h-32 flex items-end gap-1.5 px-2 group-hover:gap-2 transition-all duration-700">
              {[...Array(24)].map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [ 20, Math.random() * 60 + 20, 20 ] }}
                  transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                  className="flex-1 bg-gradient-to-t from-sovereign-gold/40 to-transparent rounded-t-lg opacity-40 group-hover:opacity-80 transition-opacity"
                />
              ))}
           </div>
           
           <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
              <div className="flex items-center gap-2 text-white/20 italic">
                <FileCode className="w-3 h-3" />
                <span>آخر بصمة: {audit?.last_hash?.substring(0, 16)}...</span>
              </div>
              <span className="text-sovereign-gold/40">{lastScan?.toLocaleTimeString()}</span>
           </div>
        </GlassPanel>

        {/* 🏦 Cryptographic Vault Metrics */}
        <GlassPanel className="p-8 grid grid-cols-2 gap-8 border-white/5" variant="obsidian">
           <div className="space-y-6">
              <div className="space-y-2">
                 <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">إجمالي الأدلة</p>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-sovereign-gold/20 rounded-full" />
                    <span className="text-3xl font-black italic tracking-tighter text-white/90 font-mono">{audit?.total_count || 0}</span>
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">الممثلين النشطين</p>
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-sovereign-gold/20 rounded-full" />
                    <span className="text-3xl font-black italic tracking-tighter text-white/90 font-mono">{audit?.actors_count || 1}</span>
                 </div>
              </div>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                 <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">بروتوكول التشفير</p>
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/[0.03] rounded-lg">
                        <Cpu className="w-4 h-4 text-sovereign-gold" />
                    </div>
                    <span className="text-xs font-black tracking-widest">BLAKE2b-512</span>
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">حالة المستودع</p>
                 <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black text-emerald-400 italic">SECURE/ENCRYPTED</span>
                 </div>
              </div>
           </div>
        </GlassPanel>

      </div>

      {/* 3. Forensic Ledger Table */}
      <GlassPanel className="overflow-hidden border-white/5 shadow-2xl" variant="default" gradientBorder>
         <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-sovereign-gold/10 rounded-lg">
                <History className="w-5 h-5 text-sovereign-gold" />
               </div>
               <h4 className="text-lg font-black italic tracking-tighter">تسلسل التدقيق المتأخر (Audit Chain)</h4>
            </div>
            {!isValid && (
              <div className="flex items-center gap-4 px-6 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 animate-gold-pulse">
                 <AlertTriangle className="w-5 h-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Chain Integrity Mismatch Detected!</span>
              </div>
            )}
         </div>
         
         <div className="p-0 overflow-x-auto">
            <table className="w-full text-right text-sm">
               <thead className="bg-white/[0.02] text-white/20 font-black uppercase text-[10px] tracking-[0.2em]">
                  <tr>
                     <th className="p-6">النزاهة</th>
                     <th className="p-6">معرف السجل القيد</th>
                     <th className="p-6">البصمة المشفرة الحالية (SH-512)</th>
                     <th className="p-6 text-left">بروتوكول الحالة</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {(audit?.chain_segment_summaries || []).slice(0, 8).map((seg: any, i: number) => (
                    <tr key={i} className="group hover:bg-white/[0.03] transition-colors duration-500">
                       <td className="p-6">
                          <div className={cn(
                            "w-3 h-3 rounded-full transition-all duration-700",
                            seg.is_valid ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                          )} />
                       </td>
                       <td className="p-6 font-mono text-white/40 group-hover:text-white/80 transition-colors">JUD-LOG-{seg.id.toString().padStart(5, '0')}</td>
                       <td className="p-6 font-mono text-[10px] text-white/30 group-hover:text-sovereign-gold transition-colors">{seg.hash.substring(0, 32)}...</td>
                       <td className="p-6 font-black italic text-left group-hover:translate-x-2 transition-transform duration-700">
                          {seg.is_valid ? (
                              <span className="text-emerald-400">IMMUTABLE_OK</span>
                          ) : (
                              <span className="text-red-500 underline decoration-red-500/30">TAMPER_DETECTED</span>
                          )}
                       </td>
                    </tr>
                  ))}
                  {(!audit || audit.total_count === 0) && (
                    <tr>
                       <td colSpan={4} className="p-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-20">
                            <Search className="w-12 h-12" />
                            <p className="text-sm font-black italic tracking-widest uppercase">لا توجد سجلات مشفرة في المستودع حالياً</p>
                          </div>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Footer Narrative */}
         <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 italic">Secure Forensic Layer V.4 | Standard High Court Registry</p>
         </div>
      </GlassPanel>
    </div>
  );
}
