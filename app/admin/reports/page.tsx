'use client'
import { formatNumber } from '@/lib/utils';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { SalesByCategoryChart } from '@/components/admin/sales-by-category-chart';

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue', days],
    queryFn: () => adminApi.getRevenue({ days }).then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
    refetchInterval: 300000,
    refetchOnWindowFocus: true,
  });

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['admin-sales-report', days],
    queryFn: () => adminApi.getSalesReport({ days }).then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
    refetchInterval: 300000,
    refetchOnWindowFocus: true,
  });

  const handleExportRevenue = async () => {
    try {
      const response = await adminApi.getRevenue({ days, export: true });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `revenue_report_${days}_days.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting revenue:', error);
    }
  };

  const handleExportSales = async () => {
    try {
      const response = await adminApi.getSalesReport({ days, export: true });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sales_report_${days}_days.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting sales report:', error);
    }
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null;
  }

  if (revenueLoading || salesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // Compute summary from flat API fields
  const totalBookings = salesReport?.total_bookings || 0;
  const totalRevenue = salesReport?.total_revenue || 0;
  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">التقارير والتحليلات</h1>
          <p className="text-muted-foreground">تقارير مفصلة عن المبيعات والإيرادات</p>
        </div>
        <div className="flex gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value={7}>آخر 7 أيام</option>
            <option value={30}>آخر 30 يوم</option>
            <option value={90}>آخر 90 يوم</option>
            <option value={365}>آخر سنة</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحجوزات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalRevenue)} دج
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الحجز</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(avgBookingValue)} دج
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 mb-6">
        <Button onClick={handleExportRevenue} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          تصدير تقرير الإيرادات (CSV)
        </Button>
        <Button onClick={handleExportSales} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          تصدير تقرير المبيعات (CSV)
        </Button>
      </div>

      {/* Revenue Chart */}
      <div className="mb-6">
        {revenueData?.data && revenueData.data.length > 0 && (
          <RevenueChart data={revenueData.data} />
        )}
      </div>

      {/* Category Chart */}
      <div className="mb-6">
        {salesReport?.categories && salesReport.categories.length > 0 && (
          <SalesByCategoryChart data={salesReport.categories} />
        )}
      </div>
    </div>
  );
}