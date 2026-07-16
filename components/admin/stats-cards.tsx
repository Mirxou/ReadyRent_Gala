'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Package, Calendar, DollarSign } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export function StatCard({ title, value, icon, trend, subtitle }: StatCardProps) {
  return (
    <Card className="card-glass border-0 overflow-hidden group hover:glow-purple transition-all duration-500">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-white/5 text-muted-foreground group-hover:bg-white/10 group-hover:text-white transition-all">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-black mb-1">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground/60 font-medium">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center text-xs mt-2 font-bold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`p-1 rounded-full ${trend.isPositive ? 'bg-green-400/10' : 'bg-red-400/10'} ml-1`}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
            </div>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground/40 text-[10px] mr-1">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  stats?: {
    total_users?: number;
    total_products?: number;
    total_bookings?: number;
    total_revenue?: number;
    active_products?: number;
    active_bookings?: number;
    pending_bookings?: number;
    completed_bookings?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="إجمالي المستخدمين"
        value={stats?.total_users || 0}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        subtitle={`${stats?.total_users || 0} مسجل`}
      />
      <StatCard
        title="إجمالي المنتجات"
        value={stats?.total_products || 0}
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
        subtitle={`${stats?.active_products || 0} نشط`}
      />
      <StatCard
        title="إجمالي الحجوزات"
        value={stats?.total_bookings || 0}
        icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        subtitle={`${stats?.pending_bookings || 0} قيد الانتظار`}
      />
      <StatCard
        title="إجمالي الإيرادات"
        value={`${(stats?.total_revenue || 0).toLocaleString('ar-DZ')} دج`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        subtitle={`${stats?.completed_bookings || 0} حجز مكتمل`}
      />
    </div>
  );
}

