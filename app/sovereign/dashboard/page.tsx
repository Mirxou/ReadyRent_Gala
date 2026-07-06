"use client"
import { formatNumber } from '@/lib/utils';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Database, 
  Activity, 
  Lock, 
  Search, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignGlow, SovereignSparkle } from '@/shared/components/sovereign/sovereign-sparkle';
import { SovereignHeartbeat } from '@/shared/components/sovereign/sovereign-heartbeat';
import { SovereignAuditTrail } from '@/shared/components/sovereign/sovereign-audit-trail';
import { DignifiedLoader } from '@/shared/components/sovereign/dignified-loader';
import { Badge } from '@/components/ui/badge';


// Types for Dashboard
interface EyeStats {
  active_disputes: number;
  total_value_locked: number;
  integrity_score: number;
  readiness_gate: number;
}

interface EvidenceEntry {
  id: number;
  action: string;
  actor_email: string;
  timestamp: string;
  metadata: any;
  hash: string;
  previous_hash: string;
}

export default function SovereignDashboard() {
  const [stats, setStats] = useState<EyeStats | null>(null);
  const [ticker, setTicker] = useState<EvidenceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tickerRes] = await Promise.all([
          fetch('/api/disputes/admin/disputes/stats/'),
          fetch('/api/disputes/admin/vault/integrity/'),
        ]);

        if (statsRes.status === 501 || tickerRes.status === 501) {
          setError('البيانات غير متاحة حالياً');
          setIsLoading(false);
          return;
        }

        if (!statsRes.ok || !tickerRes.ok) {
          setError('البيانات غير متاحة حالياً');
          setIsLoading(false);
          return;
        }

        const statsData = await statsRes.json();
        const tickerData = await tickerRes.json();

        setStats(statsData);
        setTicker(tickerData);
        setError(null);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error("Dashboard error:", err);
        setError('البيانات غير متاحة حالياً');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-sovereign-obsidian text-sovereign-white font-arabic p-6 md:p-12 relative overflow-hidden" dir="rtl">
      
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sovereign-obsidian/90 backdrop-blur-sm">
          <DignifiedLoader label="جارٍ تحميل لوحة السيادة..." />
        </div>
      )}

      {error && !isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sovereign-obsidian/90 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-sovereign-gold mx-auto animate-pulse" />
            <p className="text-2xl font-light italic text-sovereign-gold">{error}</p>
          </div>
        </div>
      )}

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-sovereign-gold/2 rounded-full blur-[140px] opacity-10 pointer-events-none" />

      {/* 🏗️ Header / Global Integrity */}
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <SovereignSparkle active={true}>
                        <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/30 rounded-full py-1 px-4 text-[10px] uppercase font-black tracking-widest">
                            العين التشغيلية النشطة
                        </Badge>
                    </SovereignSparkle>
                    <div className="flex gap-2 items-center text-green-500 font-bold text-xs uppercase tracking-tighter">
                        <Activity className="w-4 h-4 animate-pulse" /> مزامنة النزاهة المباشرة
                    </div>
                </div>
                <h1 className="text-6xl font-black italic tracking-tighter">توازن <span className="text-sovereign-gold">السيادة.</span></h1>
                <p className="text-muted-foreground text-xl font-light italic">"مرصد الحقيقة الفوري لنظام STANDARD.Rent — حيث تلتقي الشفافية بالسيادة."</p>
            </div>

            <GlassPanel className="p-8 flex items-center gap-6 rounded-3xl" gradientBorder>
                <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">نقاط نزاهة النظام</span>
                    <span className="text-5xl font-black text-sovereign-gold">{stats?.integrity_score ?? '--'}%</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold scale-125">
                    <ShieldCheck className="w-10 h-10" />
                </div>
            </GlassPanel>
        </div>

        {/* 📊 Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'الخلافات النشطة', value: stats?.active_disputes, icon: ShieldAlert, color: 'gold' },
                { label: 'القيمة المؤمنة المطلقة', value: `${formatNumber(stats?.total_value_locked ?? 0)} د.ج`, icon: Lock, color: 'gold' },
                { label: 'جاهزية الإطلاق السيادي', value: `${stats?.readiness_gate}%`, icon: TrendingUp, color: 'gold' },
                { label: 'سجلات الأدلة (الخزنة)', value: '1.4k+', icon: Database, color: 'gold' },
            ].map((m, i) => (
                <GlassPanel key={i} className="p-10 space-y-6 group hover:translate-y-[-5px] transition-all rounded-[2.5rem]">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:text-sovereign-gold transition-colors">
                        <m.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">{m.label}</span>
                        <h3 className="text-4xl font-black mt-2 tracking-tighter">{m.value ?? '...'}</h3>
                    </div>
                </GlassPanel>
            ))}
        </div>

        {/* 🏛️ ELITE JOURNEY: Institutional Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* EVIDENCE TICKER (WORM Stream) */}
            <div className="lg:col-span-2 space-y-12">
                <SovereignAuditTrail />
            </div>

            {/* SIDEBAR: SYSTEM HEALTH & AI CONCIERGE */}
            <div className="space-y-12">
                <section aria-labelledby="health-title">
                     <h2 id="health-title" className="text-3xl font-black italic tracking-tighter border-b border-white/5 pb-4 mb-8">
                        حالة <span className="text-sovereign-gold">السيادة.</span>
                    </h2>
                    <SovereignHeartbeat />
                </section>
                
                <GlassPanel className="p-10 space-y-8 rounded-[3rem]" gradientBorder aria-label="نظام الإنذار المبكر">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black italic">نظام الإنذار المبكر</h3>
                        <Activity className="w-5 h-5 text-sovereign-gold" aria-hidden="true" />
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 bg-red-900/10 border border-red-900/20 rounded-2xl space-y-3" role="alert" aria-live="assertive">
                            <div className="flex justify-between items-center">
                                <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">مرتفع المخاطر</span>
                                <ShieldAlert className="w-4 h-4 text-red-500" aria-hidden="true" />
                            </div>
                            <p className="text-sm font-light italic leading-relaxed text-red-100">"تم قفل معاملة مشبوهة بمحفظة #WALT-029: خرق السلوكية المالية."</p>
                        </div>
                    </div>
                </GlassPanel>
            </div>
        </div>


      </div>
    </div>
  );
}

