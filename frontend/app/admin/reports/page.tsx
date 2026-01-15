'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { SalesByCategoryChart } from '@/components/admin/sales-by-category-chart';
import { SalesByStatusChart } from '@/components/admin/sales-by-status-chart';
import { TopProductsChart } from '@/components/admin/top-products-chart';

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
    refetchInterval: 300000, // Refresh every 5 minutes for reports
    refetchOnWindowFocus: true,
  });

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['admin-sales-report', days],
    queryFn: () => adminApi.getSalesReport({ days }).then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
    refetchInterval: 300000, // Refresh every 5 minutes for reports
    refetchOnWindowFocus: true,
  });

  const handleExportRevenue = async () => {
    try {
      const response = await adminApi.exportRevenueCSV({ days });
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
      {salesReport?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الحجوزات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesReport.summary.total_bookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesReport.summary.total_revenue.toLocaleString()} دج
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">متوسط قيمة الحجز</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesReport.summary.avg_booking_value.toLocaleString()} دج
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">متوسط مدة الكراء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesReport.summary.avg_rental_days.toFixed(1)} يوم
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {revenueData?.daily_revenue && (
          <RevenueChart 
            data={revenueData.daily_revenue} 
            period={revenueData.period}
          />
        )}
        {salesReport?.sales_by_status && (
          <SalesByStatusChart data={salesReport.sales_by_status} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        {salesReport?.sales_by_category && salesReport.sales_by_category.length > 0 && (
          <SalesByCategoryChart data={salesReport.sales_by_category} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {salesReport?.sales_by_product && salesReport.sales_by_product.length > 0 && (
          <TopProductsChart data={salesReport.sales_by_product} limit={10} />
        )}
      </div>

      {/* Top Customers Table */}
      {salesReport?.top_customers && salesReport.top_customers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>أفضل العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">العميل</th>
                    <th className="text-right p-2">البريد الإلكتروني</th>
                    <th className="text-right p-2">عدد الحجوزات</th>
                    <th className="text-right p-2">إجمالي الإنفاق</th>
                    <th className="text-right p-2">متوسط قيمة الحجز</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.top_customers.map((customer: any, index: number) => (
                    <tr key={customer.user__id || index} className="border-b">
                      <td className="p-2">
                        {customer.user__first_name || customer.user__last_name
                          ? `${customer.user__first_name || ''} ${customer.user__last_name || ''}`.trim()
                          : 'مستخدم'}
                      </td>
                      <td className="p-2">{customer.user__email}</td>
                      <td className="p-2">{customer.booking_count}</td>
                      <td className="p-2">{customer.total_spent.toLocaleString()} دج</td>
                      <td className="p-2">{customer.avg_booking_value.toLocaleString()} دج</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

