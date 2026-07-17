'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Package, TrendingUp, DollarSign, Clock } from 'lucide-react';

interface VendorDashboard {
  vendor: {
    id: number;
    business_name_ar: string;
    status: string;
    commission_rate: number;
  };
  total_products: number;
  active_bookings: number;
  total_revenue: number;
  commission: number;
  recent_bookings: Array<{
    id: string;
    product_name: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

export default function VendorDashboardPage() {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<VendorDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/vendors/dashboard/');
      setDashboard(response.data);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error?.data?.error || 'فشل تحميل لوحة التحكم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent className="space-y-1">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-5 w-28 ml-auto" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-6 w-16 rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6" dir="rtl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا يوجد ملف مورد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      pending: <Badge variant="outline">قيد الانتظار</Badge>,
      active: <Badge className="bg-green-500">نشط</Badge>,
      suspended: <Badge className="bg-red-500">معلق</Badge>,
      inactive: <Badge variant="outline">غير نشط</Badge>,
    };
    return badges[status] || <Badge>{status}</Badge>;
  };

  const getBookingStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      active: { label: 'نشط', className: 'bg-green-500' },
      completed: { label: 'مكتمل', className: 'bg-blue-500' },
      cancelled: { label: 'ملغي', className: 'bg-red-500' },
      pending: { label: 'قيد الانتظار', className: 'bg-yellow-500' },
    };
    const entry = map[status];
    return entry ? <Badge className={entry.className}>{entry.label}</Badge> : <Badge>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم المورد</h1>
          <p className="text-muted-foreground">{dashboard.vendor.business_name_ar}</p>
        </div>
        {getStatusBadge(dashboard.vendor.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboard.total_products)}</div>
            <p className="text-xs text-muted-foreground">إجمالي المنتجات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحجوزات النشطة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboard.active_bookings)}</div>
            <p className="text-xs text-muted-foreground">حجوزات نشطة حالياً</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboard.total_revenue)} دج</div>
            <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمولات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboard.commission)} دج</div>
            <p className="text-xs text-muted-foreground">إجمالي العمولات المستحقة</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الحجوزات الأخيرة</CardTitle>
          <CardDescription>آخر الحجوزات والعمولات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.recent_bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="font-medium">{booking.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.date).toLocaleDateString('ar-DZ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatNumber(booking.amount)} دج</p>
                  <div className="mt-1">
                    {getBookingStatusBadge(booking.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}