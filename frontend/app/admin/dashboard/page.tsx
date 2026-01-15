'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import { StatsCards } from '@/components/admin/stats-cards';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, Users, ArrowRight, TrendingUp, BarChart3, ChevronLeft, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { QuickActions } from '@/components/admin/quick-actions';
import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { TiltCard } from '@/components/ui/tilt-card';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
    refetchInterval: 60000, // Refresh every 60 seconds for real-time updates
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue', 30],
    queryFn: () => adminApi.getRevenue({ days: 30 }).then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
    refetchInterval: 60000, // Refresh every 60 seconds
    refetchOnWindowFocus: true,
  });

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20 bg-[#020617]">
      <ParticleField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-12 relative z-10"
      >
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gala-purple/20 text-gala-purple">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="border-gala-purple/30 text-gala-purple">إدارة قسنطينة</Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              نظرة عامة
            </h1>
            <p className="text-xl text-muted-foreground font-medium"> إدارة المنتجات، الحجوزات والمستخدمين في مكان واحد </p>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="rounded-2xl h-14 px-8 border-white/10 hover:bg-white/5" asChild>
              <Link href="/admin/settings">
                <Settings className="ml-2 h-5 w-5" />
                الإعدادات
              </Link>
            </Button>
          </div>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <TiltCard className="card-glass border-0 rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gala-purple/20 text-gala-purple group-hover:bg-gala-purple group-hover:text-white transition-colors">
                  <Package className="h-6 w-6" />
                </div>
                المنتجات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="text-5xl font-black mb-4">{stats?.overall?.products || 0}</div>
              <p className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {stats?.products?.active || 0} نشط، {stats?.products?.rented || 0} مستأجر
              </p>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-lg" asChild>
                <Link href="/admin/products">
                  إدارة المنتجات
                  <ArrowRight className="h-5 w-5 mr-auto opacity-50" />
                </Link>
              </Button>
            </CardContent>
          </TiltCard>

          <TiltCard className="card-glass border-0 rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gala-pink/20 text-gala-pink group-hover:bg-gala-pink group-hover:text-white transition-colors">
                  <Calendar className="h-6 w-6" />
                </div>
                الحجوزات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="text-5xl font-black mb-4">{stats?.overall?.bookings || 0}</div>
              <p className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gala-gold animate-pulse" />
                {stats?.pending_actions?.bookings || 0} قيد الانتظار
              </p>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-lg" asChild>
                <Link href="/admin/bookings">
                  إدارة الحجوزات
                  <ArrowRight className="h-5 w-5 mr-auto opacity-50" />
                </Link>
              </Button>
            </CardContent>
          </TiltCard>

          <TiltCard className="card-glass border-0 rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gala-cyan/20 text-gala-cyan group-hover:bg-gala-cyan group-hover:text-white transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                المستخدمون
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="text-5xl font-black mb-4">{stats?.overall?.users || 0}</div>
              <p className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gala-purple animate-pulse" />
                +{stats?.this_month?.users || 0} مستخدم جديد هذا الشهر
              </p>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-lg" asChild>
                <Link href="/admin/users">
                  إدارة المستخدمين
                  <ArrowRight className="h-5 w-5 mr-auto opacity-50" />
                </Link>
              </Button>
            </CardContent>
          </TiltCard>
        </div>

        {/* Revenue Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {revenueData?.daily_revenue && revenueData.daily_revenue.length > 0 && (
            <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-gala-purple" />
                  تحليلات الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <RevenueChart
                  data={revenueData.daily_revenue}
                  period={revenueData.period}
                />
                <div className="mt-8">
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-white/10" asChild>
                    <Link href="/admin/reports">
                      عرض جميع التقارير
                      <ArrowRight className="h-4 w-4 mr-auto opacity-50" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.top_products && stats.top_products.length > 0 && (
            <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-gala-pink" />
                  الأكثر تألقاً
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-4">
                  {stats.top_products.map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black group-hover:bg-gala-pink transition-colors">
                          {index + 1}
                        </div>
                        <span className="text-lg font-bold">{product.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-white/10">
                        {product.bookings} حجز
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="mt-12">
          <QuickActions />
        </div>
      </motion.div>
    </div>
  );
}

