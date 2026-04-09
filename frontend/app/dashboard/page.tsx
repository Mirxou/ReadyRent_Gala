"use client";

import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  FileSignature,
  History as HistoryIcon,
  CreditCard,
  Car,
  Home,
  AlertTriangle,
  Loader2,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  BrainCircuit,
  Scale,
  Layers,
  Download,
  Play,
  Globe,
  Smartphone
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { IdentityShield } from '@/shared/components/sovereign/identity-shield';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { SovereignSparkle, SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { useQuery } from '@tanstack/react-query';
import { bookingsApi, authApi } from '@/lib/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { SocialFeed } from '@/features/social/components/social-feed';
import { SovereignLedger } from '@/shared/components/sovereign/sovereign-ledger';
import { SovereignConcierge } from '@/shared/components/sovereign/sovereign-concierge';
import { SovereignPredictivePulse } from '@/features/analytics/components/predictive-pulse';

import { Sovereign2FAEnrollment } from '@/shared/components/sovereign/2fa-enrollment';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user, setAuth, isAuthenticated } = useAuthStore();

  // Sync User Data
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then(res => res.data),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (me) setAuth(me);
  }, [me, setAuth]);

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.getAll().then(res => res.data),
    enabled: isAuthenticated
  });

  const activeBookings = bookings.filter((b: any) => ['pending', 'confirmed', 'in_use'].includes(b.status));

  const trustScore = user?.trust_score || 0;
  const isElite = trustScore >= 100; // Phase 10 Obsidian Tier
  const isSovereign = trustScore >= 1; 
  const is2FAEnabled = (user as any)?.is_2fa_enabled;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={cn(
        "space-y-12 min-h-screen text-right pb-20 airy-dashboard",
        isElite && "theme-obsidian"
      )} 
      dir="rtl"
    >

      {/* 1. Header: The Greeting */}
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-center">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="text-muted-foreground font-light text-2xl">غرفة القيادة /</span>
              <span className="bg-gradient-to-l from-sovereign-gold to-foreground bg-clip-text text-transparent">
                {user?.username || 'المواطن'}
              </span>
            </h1>
            
            {/* 🛡️ Sovereign Guard Status */}
            <Dialog>
                <DialogTrigger asChild>
                    <button className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all hover:scale-105",
                        is2FAEnabled 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                            : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
                    )}>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-tight">Sovereign Guard</span>
                            <span className="text-[9px] font-bold opacity-60">
                                {is2FAEnabled ? "حماية نشطة" : "تأمين الهوية مطلوب"}
                            </span>
                        </div>
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border",
                            is2FAEnabled ? "bg-emerald-500/20 border-emerald-500/30" : "bg-red-500/20 border-red-500/30"
                        )}>
                            <ShieldCheck className={cn("w-5 h-5", is2FAEnabled ? "text-emerald-500" : "text-red-500")} />
                        </div>
                    </button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-transparent border-0 p-0 shadow-none">
                    <Sovereign2FAEnrollment />
                </DialogContent>
            </Dialog>
        </div>

        <p className="text-muted-foreground flex items-center gap-2 text-sm mt-2">
          <Badge className="bg-sovereign-gold/10 text-sovereign-gold border-0">VIP</Badge>
          الهوية السيادية: {isSovereign ? "مفعلة (Elite)" : "قيد البناء"}
        </p>
      </div>

      {/* 2. The Sovereign Balance (Trust Score) & Predictive Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Main Trust Assessment */}
                <SovereignGlow color="gold">
                    <GlassPanel className="p-10 relative overflow-hidden flex flex-col justify-between h-full" gradientBorder>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 opacity-40">رصيد الثقة السيادي</h3>
                            <div className="text-8xl font-mono font-black text-foreground tracking-tighter leading-none group flex items-baseline gap-2">
                                <SovereignSparkle active={isSovereign}>
                                    {trustScore}
                                </SovereignSparkle>
                                <span className="text-2xl text-muted-foreground font-sans opacity-20">/ 100</span>
                                <Sparkles className="w-6 h-6 text-sovereign-gold animate-pulse ml-4" />
                            </div>
                            <div className="mt-8">
                                <Badge className={cn(
                                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest border-0",
                                    isSovereign ? "bg-sovereign-gold/10 text-sovereign-gold" : "bg-white/5 text-muted-foreground"
                                )}>
                                    {isSovereign ? "مستوى النخبة (High Trust)" : "مستوى قيد البناء"}
                                </Badge>
                            </div>
                        </div>
                        <div className="absolute left-[-10%] top-[-10%] opacity-[0.05] pointer-events-none">
                            <IdentityShield status={isSovereign ? "verified" : "pending"} showLabel={false} className="w-80 h-80" />
                        </div>
                    </GlassPanel>
                </SovereignGlow>

                {/* 2. Trust Breakdown */}
                <GlassPanel className="p-10 space-y-8 bg-white/5 border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">تحليل السلوك الائتماني</h4>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                <span className="text-muted-foreground">نسبة الالتزام بالمواعيد</span>
                                <span className="text-emerald-500">98%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: '98%' }} 
                                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                <span className="text-muted-foreground">معدل سلامة الأصول</span>
                                <span className="text-sovereign-gold">4.9/5.0</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: '94%' }} 
                                    className="h-full bg-sovereign-gold shadow-[0_0_10px_rgba(184,159,103,0.3)]"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex-1 text-center">
                                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">حل النزاعات</p>
                                <p className="text-lg font-black font-mono">100%</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex-1 text-center">
                                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">عقود منتهية</p>
                                <p className="text-lg font-black font-mono">{bookings.length}</p>
                            </div>
                        </div>
                    </div>
                </GlassPanel>
            </div>

            {/* 🔥 PHASE 10: Sovereign Predictive Pulse */}
            <SovereignPredictivePulse />

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <Link href="/dashboard/wallet">
                    <GlassPanel className="p-6 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group border-white/5">
                        <div className="space-y-2">
                            <p className="font-black text-md tracking-tight text-foreground">الخزانة المالية</p>
                            <p className="text-[10px] text-muted-foreground font-mono opacity-60">
                                {Number(user?.wallet_balance || 0).toLocaleString()} DZD
                            </p>
                        </div>
                        <CreditCard className="w-6 h-6 text-sovereign-gold group-hover:scale-110 transition-transform opacity-40 group-hover:opacity-100" />
                    </GlassPanel>
                </Link>
                <Link href="/dashboard/social">
                    <GlassPanel className="p-6 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group border-white/5 bg-gradient-to-br from-cyan-500/5 to-transparent">
                        <div className="space-y-2">
                            <p className="font-black text-md tracking-tight text-foreground">قائد التواصل</p>
                            <p className="text-[9px] text-cyan-400 font-black uppercase tracking-widest opacity-60">
                                Social Hub (DZ)
                            </p>
                        </div>
                        <Smartphone className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform opacity-40 group-hover:opacity-100" />
                    </GlassPanel>
                </Link>
                <Link href="/dashboard/analytics">
                    <GlassPanel className="p-6 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group border-white/5">
                        <div className="space-y-2">
                            <p className="font-black text-md tracking-tight text-foreground">نبض النظام</p>
                            <p className="text-[9px] text-sovereign-gold font-black uppercase tracking-widest opacity-60">
                                Predict Engine
                            </p>
                        </div>
                        <BrainCircuit className="w-6 h-6 text-sovereign-gold group-hover:scale-110 transition-transform opacity-40 group-hover:opacity-100" />
                    </GlassPanel>
                </Link>
                <Link href="/dashboard/orders">
                    <GlassPanel className="p-6 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group border-white/5">
                        <div className="space-y-2">
                            <p className="font-black text-md tracking-tight text-foreground">أرشيف العقود</p>
                            <p className="text-[9px] text-muted-foreground opacity-60 uppercase">History</p>
                        </div>
                        <HistoryIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform opacity-40 group-hover:opacity-100" />
                    </GlassPanel>
                </Link>
            </div>

            {/* 🧠 Sovereign Intelligence Hub (Phase 9) */}
            <SovereignGlow color="gold">
                <GlassPanel className="p-10 bg-gradient-to-br from-sovereign-gold/5 via-transparent to-transparent border-sovereign-gold/20 relative overflow-hidden" gradientBorder>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <BrainCircuit className="w-8 h-8 text-sovereign-gold" />
                                <h3 className="text-3xl font-black italic tracking-tighter">مركز الاستخبارات السيادي</h3>
                            </div>
                            <p className="text-muted-foreground italic leading-relaxed max-w-xl">
                                استعرض آخر تقارير توجهات السوق لعام 2026. بيانات حصرية مدعومة بذكاء ReadyRent لتحليل الأصول والسيولة الإقليمية في الجزائر.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link href="/reports/sovereign_intel_2026_ar.md">
                                    <SovereignButton size="lg" variant="secondary" className="rounded-full px-8 h-12 text-xs">
                                        تنزيل تقرير 2026 (PDF) <Download className="mr-3 w-4 h-4" />
                                    </SovereignButton>
                                </Link>
                                <Link href="/sovereign/presentation">
                                    <SovereignButton size="lg" variant="primary" className="rounded-full px-8 h-12 text-xs shadow-xl" withShimmer>
                                        عرض ميثاق السيادة <Play className="mr-3 w-4 h-4 fill-current" />
                                    </SovereignButton>
                                </Link>
                            </div>
                        </div>
                        <div className="hidden lg:block w-40 h-40 opacity-20">
                            <Globe className="w-full h-full text-sovereign-gold animate-soft-pulse" />
                        </div>
                    </div>
                </GlassPanel>
            </SovereignGlow>

            {/* 🔥 Symmetrical Mastery Action (Become a Provider) */}
            <Link href="/dashboard/standardize">
                <GlassPanel className="p-10 bg-gradient-to-l from-white/5 to-transparent border-white/10 flex flex-col md:flex-row items-center justify-between group overflow-hidden">
                     <div className="space-y-4 text-center md:text-right">
                         <div className="flex items-center gap-3 justify-center md:justify-start">
                            <Sparkles className="w-5 h-5 text-sovereign-gold" />
                            <h3 className="text-2xl font-black italic">حوّل مقتنياتك إلى أصول سيادية</h3>
                         </div>
                         <p className="text-sm text-muted-foreground italic opacity-80 max-w-xl">
                            بروتوكول "المعيرة" يسمح لك بإدراج أصولك (فساتين، سيارات، أدوات) ضمن سجل النخبة وتوليد قيمة حقيقية منها. ابدأ رحلتك كمزود سيادي اليوم.
                         </p>
                     </div>
                     <SovereignButton size="xl" variant="secondary" className="h-16 px-12 rounded-2xl group border-white/10">
                        ابدأ المعيرة <ArrowRight className="w-5 h-5 mr-4 transition-transform group-hover:translate-x-2" />
                     </SovereignButton>
                     <div className="absolute left-[-5%] bottom-[-10%] opacity-[0.03] rotate-12 pointer-events-none">
                        <Layers className="w-64 h-64" />
                     </div>
                </GlassPanel>
            </Link>
        </div>

        {/* Sidebar: Social Pulse */}
        <div className="lg:col-span-4 h-full">
            <GlassPanel className="p-8 h-full bg-background/50" gradientBorder>
                <SocialFeed />
            </GlassPanel>
        </div>
      </div>

      {/* 3. Active Contracts: The Heart of the Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 pt-8 border-t border-white/5">
        
        {/* Left: Active Contracts (Primary Focus) */}
        <div className="lg:col-span-12 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-4 text-foreground">
                        <FileSignature className="w-8 h-8 text-sovereign-gold" />
                        سجل العقود السيادية (Active Registry)
                    </h2>
                    <p className="text-xs text-muted-foreground font-light px-12">العقود الجارية، الضمانات المجمدة، ومواعيد الإفراج.</p>
                </div>
                <Badge variant="outline" className="border-white/5 text-muted-foreground px-4 py-1">{activeBookings.length} Active</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isBookingsLoading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-sovereign-gold mx-auto mb-4" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Consulting Digital Ledger...</span>
                    </div>
                ) : activeBookings.length > 0 ? (
                    activeBookings.map((booking: any) => (
                    <GlassPanel key={booking.id} className="p-8 relative group hover:border-sovereign-gold/30 transition-all duration-500 shadow-2xl" gradientBorder>
                        
                        {/* Status Identifier */}
                        <div className="absolute top-0 left-0 p-4 opacity-[0.03] pointer-events-none">
                            <ShieldCheck className="w-20 h-20" />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <h4 className="font-black text-xl text-foreground tracking-tight">{booking.product_name || booking.product?.name_ar || 'Asset'}</h4>
                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest opacity-50">#ST-{booking.id.toString().padStart(6, '0')}</p>
                            </div>
                            <Badge className={cn(
                                "px-3 py-1 text-[10px] font-black uppercase border-0",
                                booking.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500" :
                                booking.status === 'in_use' ? "bg-blue-500/10 text-blue-500" :
                                "bg-yellow-500/10 text-yellow-500 shadow-sm"
                            )}>
                                {booking.status === 'confirmed' ? 'Confirmed' :
                                booking.status === 'in_use' ? 'Active Use' : booking.status}
                            </Badge>
                        </div>

                        <div className="space-y-3 text-sm text-muted-foreground mb-8 border-y border-white/5 py-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-sovereign-gold" />
                                    <span className="font-bold opacity-60">تاريخ الإفراج (Release):</span>
                                </div>
                                <span className="font-mono text-foreground font-bold">{format(new Date(booking.end_date), 'dd MMM yyyy', { locale: ar })}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">Sovereign Value (Escrow)</span>
                            <span className="text-2xl font-black text-sovereign-gold">{Number(booking.total_price).toLocaleString()} <span className="text-xs font-normal">DA</span></span>
                        </div>

                        <Link href={`/dashboard/orders/${booking.id}`} className="w-full">
                            <SovereignButton size="lg" variant="secondary" className="w-full font-black tracking-widest text-[10px] uppercase h-14" withShimmer>
                                تفاصيل العقد السيادي
                            </SovereignButton>
                        </Link>
                    </GlassPanel>
                    ))
                ) : (
                    <GlassPanel className="col-span-full flex flex-col items-center justify-center p-20 text-center border-dashed border-white/10 bg-transparent min-h-[400px]">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                            <FileSignature className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mb-4 opacity-80">سجل باهت (No Active Contracts)</h3>
                        <p className="text-muted-foreground/60 mb-10 max-w-sm mx-auto text-lg leading-relaxed font-light">
                            بصمتك السيادية بانتظار العقد الأول. تصفح الأصول الملكية لبدء بناء تاريخك الائتماني.
                        </p>
                        <Link href="/products">
                            <SovereignButton variant="primary" size="xl" withShimmer className="px-12 h-16 text-lg font-black">
                                تصفح سجل الأصول (Explore)
                            </SovereignButton>
                        </Link>
                    </GlassPanel>
                )}
            </div>
        </div>

        {/* 4. Transparency Ledger (Subtle Bottom Section) */}
        <div className="lg:col-span-12 pt-20">
            <div className="flex flex-col items-center mb-10 text-center space-y-4">
                <Scale className="w-10 h-10 text-muted-foreground opacity-20" />
                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-muted-foreground opacity-30">الحوكمة السيادية (System Transparency)</h3>
                <div className="h-px w-20 bg-muted-foreground/10" />
            </div>
            <SovereignLedger />
        </div>
      </div>

      {/* 🤖 THE ORACLE CONCIERGE (Global Support) */}
      <SovereignConcierge />
    </motion.div>
  );
}
