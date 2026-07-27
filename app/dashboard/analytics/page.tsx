"use client";

import { useQuery } from '@tanstack/react-query';
import { authApi, bookingsApi } from '@/lib/api';
import {
  TrendingUp,
  Target,
  Zap,
  Compass,
  Activity,
  BrainCircuit,
  PieChart,
  Fingerprint,
  Users,
  History,
  Loader2
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignRadar } from '@/shared/components/sovereign/sovereign-radar';
import { EcosystemPulse } from '@/features/analytics/components/ecosystem-pulse';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn, formatNumber } from '@/lib/utils';
import { SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';

interface Booking {
  id: string;
  status: string;
  total_price: number;
  start_date: string;
  end_date: string;
  category_name?: string;
  product_name?: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.me().then(res => res.data),
  });

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ['analytics-bookings'],
    queryFn: () => bookingsApi.getAll().then(res => res.data || []),
  });

  // ──── Derived stats from real bookings ────
  const completedBookings = bookings.filter((b: Booking) => ['completed', 'returned'].includes(b.status));
  const totalSpent = completedBookings.reduce((sum: number, b: Booking) => sum + (b.total_price || 0), 0);
  const avgSpend = completedBookings.length > 0 ? Math.round(totalSpent / completedBookings.length) : null;

  // Average booking duration in days
  const durations = completedBookings
    .map((b: Booking) => {
      const start = new Date(b.start_date).getTime();
      const end = new Date(b.end_date).getTime();
      return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    });
  const avgDuration = durations.length > 0 ? (durations.reduce((a: number, b: number) => a + b, 0) / durations.length).toFixed(1) : null;

  // Top category frequency
  const categoryCount: Record<string, number> = {};
  bookings.forEach((b: Booking) => {
    const cat = b.category_name || b.product_name || 'أخرى';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategory?.[0] || '—';
  const topCategoryPct = topCategory && bookings.length > 0
    ? Math.round((topCategory[1] / bookings.length) * 100)
    : null;

  // Trust trajectory: completed bookings per month for last 6 months
  const now = new Date();
  const monthlyCounts = Array.from({ length: 6 }, (_, i) => {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59);
    return bookings.filter((b: Booking) => {
      const d = new Date(b.created_at);
      return d >= monthStart && d <= monthEnd;
    }).length;
  });
  const maxMonthly = Math.max(...monthlyCounts, 1);

  // Radar data from category distribution (top 3)
  const radarPoints = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({
      value: Math.round((count / bookings.length) * 100),
      label: label.length > 18 ? label.slice(0, 18) + '...' : label,
    }));

  return (
    <div className="space-y-12 pb-20 text-right px-6" dir="rtl">

      {/* Header */}
      <header className="flex flex-col gap-4">
        <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-sovereign-gold/5 w-fit">
          Ecosystem Tactical Intelligence Hub
        </Badge>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground italic flex items-center gap-4">
          ذكاء <span className="text-sovereign-gold">النظام</span> السيادي<span className="text-sovereign-gold">.</span>
        </h1>
        <p className="text-muted-foreground font-light text-xl italic opacity-80 pl-10 border-l-2 border-sovereign-gold/10">تحليل استباقي للسلوك والتوقعات المستقبلية.</p>
      </header>

      {/* Ecosystem Pulse */}
      <EcosystemPulse />

      {isBookingsLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-sovereign-gold mx-auto mb-4" />
          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">جاري تحميل التحليلات...</span>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* RIGHT: Behavior Profile */}
        <div className="lg:col-span-4 space-y-10">
          <SovereignGlow color="gold">
            <GlassPanel className="p-10 relative overflow-hidden group h-full" gradientBorder>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-sovereign-gold/10 rounded-2xl flex items-center justify-center text-sovereign-gold">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black italic">البصمة السلوكية</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40">Biometric Trust Signature</p>
                </div>
              </div>

              <div className="space-y-12 relative z-10">
                {/* Top Category */}
                <div className="space-y-5">
                  <div className="flex items-end justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">التصنيف المفضل</p>
                    {topCategoryPct !== null && (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] font-black uppercase">
                        {topCategoryPct}% Preference
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-2xl font-black italic underline decoration-sovereign-gold/30">
                    {bookings.length > 0 ? topCategoryName : 'لا توجد بيانات بعد'}
                  </h4>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: topCategoryPct ? `${topCategoryPct}%` : '0%' }}
                      transition={{ duration: 2 }}
                      className="h-full bg-sovereign-gold"
                    />
                  </div>
                </div>

                {/* Spending DNA */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">نمط الاستهلاك (Spending DNA)</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-sovereign-gold/5 transition-all">
                      <p className="text-[10px] text-muted-foreground mb-2 font-black">متوسط الصرف</p>
                      <p className="text-2xl font-black">
                        {avgSpend !== null ? `${formatNumber(avgSpend)}` : '—'}
                        <span className="text-xs font-normal"> DA</span>
                      </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-cyan-500/5 transition-all">
                      <p className="text-[10px] text-muted-foreground mb-2 font-black">متوسط المدة</p>
                      <p className="text-2xl font-black">
                        {avgDuration !== null ? avgDuration : '—'}
                        <span className="text-xs font-normal"> يوم</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </SovereignGlow>

          {/* Oracle Forecasts */}
          <GlassPanel className="p-10 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20 space-y-8" gradientBorder>
            <div className="flex items-center gap-4">
              <Compass className="w-10 h-10 text-cyan-400" />
              <h4 className="text-xl font-black italic">توقعات الـ Oracle</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic opacity-80">
              {bookings.length >= 3
                ? `بناءً على ${completedBookings.length} عملية سابقة، يتوقع النظام نمواً بنسبة ${topCategoryPct || 0}% في فئة "${topCategoryName}" خلال الفترة القادمة.`
                : 'احجز 3 عمليات على الأقل لتفعيل توقعات الـ Oracle المبنية على بصمتك السلوكية.'
              }
            </p>
          </GlassPanel>
        </div>

        {/* LEFT: Tactical Engine */}
        <div className="lg:col-span-8 space-y-10">

          {/* Radar + Trajectory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <GlassPanel className="p-10 h-[500px]" gradientBorder>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black flex items-center gap-4 italic">
                  <Activity className="w-6 h-6 text-sovereign-gold" /> رادار الطلب الاستراتيجي
                </h3>
                <Badge variant="outline" className="border-sovereign-gold/20 text-sovereign-gold uppercase text-[10px]">
                  {bookings.length > 0 ? 'Active Clusters' : 'No Data'}
                </Badge>
              </div>
              {radarPoints.length > 0 ? (
                <SovereignRadar
                  className="h-[350px] border-none"
                  points={radarPoints}
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center">
                  <p className="text-muted-foreground/40 text-sm">لا توجد بيانات كافية للرادار</p>
                </div>
              )}
            </GlassPanel>

            <GlassPanel className="p-10 h-[500px] flex flex-col" gradientBorder>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black flex items-center gap-4 italic">
                  <TrendingUp className="w-6 h-6 text-emerald-500" /> مسار تصاعد الثقة
                </h3>
              </div>

              <div className="flex-1 relative flex items-end gap-3 pb-6">
                {monthlyCounts.map((count, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(count / maxMonthly) * 80}%` }}
                    transition={{ delay: i * 0.1, duration: 1.5 }}
                    className={cn(
                      "flex-1 rounded-lg group relative",
                      count > 0
                        ? "bg-gradient-to-t from-emerald-500/20 to-emerald-500"
                        : "bg-white/5"
                    )}
                  >
                    {count > 0 && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all">
                        {count} حجز
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                <span>قبل 6 أشهر</span>
                <span>الآن</span>
              </div>
            </GlassPanel>
          </div>

          {/* Metrics Command Slab — real data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassPanel className="p-8 border-white/5 group hover:border-sovereign-gold/20 transition-all">
              <Zap className="w-8 h-8 mb-6 text-sovereign-gold transition-transform group-hover:scale-110" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 opacity-40">إجمالي الإنفاق</p>
              <p className="text-2xl font-black italic">{formatNumber(totalSpent)} <span className="text-xs font-normal">DA</span></p>
            </GlassPanel>
            <GlassPanel className="p-8 border-white/5 group hover:border-sovereign-gold/20 transition-all">
              <Target className="w-8 h-8 mb-6 text-emerald-500 transition-transform group-hover:scale-110" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 opacity-40">معدل الإنجاز</p>
              <p className="text-2xl font-black italic">
                {bookings.length > 0 ? `${Math.round((completedBookings.length / bookings.length) * 100)}%` : '—'}
              </p>
            </GlassPanel>
            <GlassPanel className="p-8 border-white/5 group hover:border-sovereign-gold/20 transition-all">
              <Users className="w-8 h-8 mb-6 text-cyan-400 transition-transform group-hover:scale-110" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 opacity-40">نقاط الثقة</p>
              <p className="text-2xl font-black italic">{userProfile?.trust_score || 0} <span className="text-xs font-normal">/ 100</span></p>
            </GlassPanel>
          </div>

          {bookings.length === 0 && (
            <GlassPanel className="p-10 bg-white/5 border-dashed border-white/10 text-center space-y-4">
              <History className="w-10 h-10 text-muted-foreground/10 mx-auto" />
              <p className="text-sm text-muted-foreground/60">ابدأ بحجز منتجات لتظهر بيانات التحليل هنا.</p>
            </GlassPanel>
          )}
        </div>
      </div>
      )}

    </div>
  );
}
