'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Store, Package, TrendingUp, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

interface VendorDashboard {
  vendor: {
    id: number;
    business_name_ar: string;
    status: string;
    commission_rate: number;
  };
  total_products: number;
  total_bookings: number;
  total_revenue: number;
  total_commission: number;
  pending_commission: number;
  recent_bookings: Array<{
    id: number;
    product_name: string;
    sale_amount: number;
    commission_amount: number;
    status: string;
    calculated_at: string;
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
        description: error.response?.data?.error || 'فشل تحميل لوحة التحكم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا يوجد ملف مورد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="outline">قيد الانتظار</Badge>,
      active: <Badge className="bg-green-500">نشط</Badge>,
      suspended: <Badge className="bg-red-500">معلق</Badge>,
      inactive: <Badge variant="outline">غير نشط</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
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
            <div className="text-2xl font-bold">{dashboard.total_products}</div>
            <p className="text-xs text-muted-foreground">إجمالي المنتجات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحجوزات</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_bookings}</div>
            <p className="text-xs text-muted-foreground">إجمالي الحجوزات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_revenue.toFixed(2)} دج</div>
            <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمولات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.total_commission.toFixed(2)} دج</div>
            <p className="text-xs text-muted-foreground">
              معلق: {dashboard.pending_commission.toFixed(2)} دج
            </p>
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
                    {new Date(booking.calculated_at).toLocaleDateString('ar')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{booking.sale_amount.toFixed(2)} دج</p>
                  <p className="text-sm text-muted-foreground">
                    عمولة: {booking.commission_amount.toFixed(2)} دج
                  </p>
                  <Badge className="mt-1">{booking.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


