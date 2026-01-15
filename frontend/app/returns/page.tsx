'use client';

import { useQuery } from '@tanstack/react-query';
import { returnsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ReturnsPage() {
  const { data: returns, isLoading } = useQuery({
    queryKey: ['my-returns'],
    queryFn: () => returnsApi.getMyReturns().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل طلبات الإرجاع...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      requested: { label: 'طلب الإرجاع', variant: 'outline' },
      approved: { label: 'موافق عليه', variant: 'default' },
      scheduled: { label: 'مجدول للاستلام', variant: 'default' },
      in_transit: { label: 'قيد النقل', variant: 'default' },
      received: { label: 'تم الاستلام', variant: 'secondary' },
      inspecting: { label: 'قيد الفحص', variant: 'outline' },
      accepted: { label: 'مقبول', variant: 'default' },
      damaged: { label: 'تالف', variant: 'destructive' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
      completed: { label: 'مكتمل', variant: 'secondary' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!returns || returns.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">طلبات الإرجاع</h1>
        </div>
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">لا توجد طلبات إرجاع</h2>
          <p className="text-muted-foreground mb-6">
            لم تقم بطلب إرجاع أي منتجات بعد
          </p>
          <Button asChild>
            <Link href="/dashboard/bookings">عرض الحجوزات</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">طلبات الإرجاع</h1>
        <p className="text-muted-foreground">
          {returns.length} {returns.length === 1 ? 'طلب إرجاع' : 'طلبات إرجاع'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {returns.map((returnRequest: any) => (
          <Card key={returnRequest.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{returnRequest.booking_details?.product_name || 'منتج'}</CardTitle>
                {getStatusBadge(returnRequest.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
                    <p className="font-semibold">
                      {new Date(returnRequest.requested_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
                {returnRequest.scheduled_pickup_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ الاستلام المجدول</p>
                      <p className="font-semibold">
                        {new Date(returnRequest.scheduled_pickup_date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                )}
                {returnRequest.is_late && (
                  <div className="col-span-2">
                    <Badge variant="destructive">متأخر</Badge>
                  </div>
                )}
              </div>
              {returnRequest.return_notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-1">ملاحظات:</p>
                  <p className="text-sm text-muted-foreground">{returnRequest.return_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

