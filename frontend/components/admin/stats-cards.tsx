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
    overall?: {
      users?: number;
      products?: number;
      bookings?: number;
      revenue?: number;
    };
    this_month?: {
      users?: number;
      bookings?: number;
      revenue?: number;
    };
    products?: {
      active?: number;
      rented?: number;
    };
    pending_actions?: {
      bookings?: number;
    };
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="إجمالي المستخدمين"
        value={stats?.overall?.users || 0}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        subtitle={`+${stats?.this_month?.users || 0} هذا الشهر`}
      />
      <StatCard
        title="إجمالي المنتجات"
        value={stats?.overall?.products || 0}
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
        subtitle={`${stats?.products?.active || 0} نشط`}
      />
      <StatCard
        title="إجمالي الحجوزات"
        value={stats?.overall?.bookings || 0}
        icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        subtitle={`${stats?.pending_actions?.bookings || 0} قيد الانتظار`}
      />
      <StatCard
        title="إجمالي الإيرادات"
        value={`${(stats?.overall?.revenue || 0).toFixed(0)} دج`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        subtitle={`${(stats?.this_month?.revenue || 0).toFixed(0)} دج هذا الشهر`}
      />
    </div>
  );
}

