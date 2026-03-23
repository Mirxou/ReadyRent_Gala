"use client";

import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  FileSignature,
  History,
  CreditCard,
  Car,
  Home,
  AlertTriangle
} from 'lucide-react';
import { GlassPanel } from '@/components/sovereign/glass-panel';
import { IdentityShield } from '@/components/sovereign/identity-shield';
import { SovereignButton } from '@/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { bookingsApi, authApi } from '@/lib/api';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  const isSovereign = trustScore >= 80;

  return (
    <div className="space-y-8 min-h-screen text-right pb-20" dir="rtl">

      {/* 1. Header: The Greeting */}
      <div className="flex flex-col gap-2 relative z-10">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <span className="text-muted-foreground font-light text-2xl">غرفة القيادة /</span>
          <span className="bg-gradient-to-l from-sovereign-gold to-foreground bg-clip-text text-transparent">
            {user?.username || 'المواطن'}
          </span>
        </h1>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <ShieldCheck className="w-4 h-4 text-sovereign-gold" />
          الهوية السيادية: {isSovereign ? "مفعلة (High Trust)" : "قيد البناء (Standard)"}
        </p>
      </div>

      {/* 2. The Sovereign Balance (Trust Score) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <GlassPanel className="md:col-span-2 p-8 relative overflow-hidden flex items-center justify-between min-h-[200px]" gradientBorder>
          <div className="relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">رصيد الثقة (Sovereign Balance)</h3>
            <div className="text-7xl font-mono font-bold text-foreground tracking-tighter leading-none">
              {trustScore} <span className="text-lg text-muted-foreground font-sans">/ 100</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {isSovereign ? (
                <Badge className="bg-sovereign-gold/20 text-sovereign-gold hover:bg-sovereign-gold/30 border-0 px-3 py-1 text-sm">
                  <ShieldCheck className="w-3 h-3 ml-2" /> معفى من الضمانات
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground border-white/10 px-3 py-1 text-sm">
                  <AlertTriangle className="w-3 h-3 ml-2 text-yellow-500" /> مطلوب ضمان للعقود
                </Badge>
              )}
            </div>
          </div>

          <div className="absolute left-10 top-1/2 -translate-y-1/2 opacity-10">
            <IdentityShield status={isSovereign ? "verified" : "pending"} showLabel={false} className="w-48 h-48" />
          </div>
        </GlassPanel>

        {/* Quick Actions */}
        <div className="grid grid-rows-2 gap-6 h-full">
          <GlassPanel className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
            <div>
              <p className="font-bold text-lg">المحفظة المالية</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">DZD 0.00</p>
            </div>
            <CreditCard className="w-8 h-8 text-sovereign-gold group-hover:scale-110 transition-transform opacity-80" />
          </GlassPanel>
          <GlassPanel className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
            <div>
              <p className="font-bold text-lg">سجل العقود</p>
              <p className="text-xs text-muted-foreground mt-1">الأرشيف الكامل</p>
            </div>
            <History className="w-8 h-8 text-sovereign-blue group-hover:scale-110 transition-transform opacity-80" />
          </GlassPanel>
        </div>
      </div>

      {/* 3. Active Contracts (The Commitments) */}
      <div className="space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FileSignature className="w-6 h-6 text-sovereign-gold" />
            العقود النشطة
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {isBookingsLoading ? (
            <div className="col-span-full flex justify-center p-12">
              <span className="animate-pulse text-sovereign-gold">تحميل العقود السيادية...</span>
            </div>
          ) : activeBookings.length > 0 ? (
            activeBookings.map((booking: any) => (
              <GlassPanel key={booking.id} className="p-6 relative group hover:border-sovereign-gold/30 transition-colors" gradientBorder>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-foreground">{booking.product_name || booking.product?.name_ar || 'Asset'}</h4>
                    <p className="text-xs text-muted-foreground font-mono">ID: {booking.id.toString().padStart(6, '0')}</p>
                  </div>
                  <Badge variant="outline" className={
                    booking.status === 'confirmed' ? "text-green-500 border-green-500/20 bg-green-500/10" :
                      booking.status === 'in_use' ? "text-blue-500 border-blue-500/20 bg-blue-500/10" :
                        "text-yellow-500 border-yellow-500/20 bg-yellow-500/10"
                  }>
                    {booking.status === 'confirmed' ? 'مؤكد (Confirmed)' :
                      booking.status === 'in_use' ? 'قيد الاستخدام (Active)' : booking.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex justify-between">
                    <span>البداية:</span>
                    <span className="font-mono text-foreground">{format(new Date(booking.start_date), 'dd MMM yyyy', { locale: ar })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>النهاية:</span>
                    <span className="font-mono text-foreground">{format(new Date(booking.end_date), 'dd MMM yyyy', { locale: ar })}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                    <span>القيمة الإجمالية:</span>
                    <span className="font-mono text-sovereign-gold font-bold">{Number(booking.total_price).toLocaleString()} دج</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link href={`/bookings/${booking.id}`} className="w-full">
                    <SovereignButton size="sm" variant="secondary" className="w-full">
                      عرض العقد
                    </SovereignButton>
                  </Link>
                </div>
              </GlassPanel>
            ))
          ) : (
            /* Empty State / Discovery */
            <GlassPanel className="col-span-full flex flex-col items-center justify-center p-16 text-center border-dashed border-white/10 bg-transparent min-h-[300px]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <FileSignature className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">لا توجد عقود نشطة حالياً</h3>
              <p className="text-muted-foreground/60 mb-8 max-w-md mx-auto">
                رصيدك السيادي جاهز. ابدأ رحلتك باكتشاف أصول النخبة المتاحة للكراء.
              </p>
              <div className="flex gap-4">
                <Link href="/products">
                  <SovereignButton variant="primary" size="lg" withShimmer>
                    تصفح الأصول (Standard Assets)
                  </SovereignButton>
                </Link>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
