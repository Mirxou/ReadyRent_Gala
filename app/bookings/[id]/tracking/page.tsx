'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, CheckCircle, Clock, Truck } from 'lucide-react';

export default function TrackingPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId).then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل معلومات التتبع...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">لا توجد معلومات تتبع</h2>
          <p className="text-muted-foreground">
            لم يتم العثور على الحجز. التتبع متاح للحجوزات المؤكدة والنشطة.
          </p>
        </div>
      </div>
    );
  }

  // Build tracking stages based on booking status
  const stages = [
    { key: 'confirmed', label: 'تم التأكيد', icon: CheckCircle, done: ['confirmed', 'active', 'completed'].includes(booking.status) },
    { key: 'preparing', label: 'جاري التحضير', icon: Package, done: ['active', 'completed'].includes(booking.status) },
    { key: 'delivering', label: 'في الطريق', icon: Truck, done: ['active', 'completed'].includes(booking.status) },
    { key: 'delivered', label: 'تم التسليم', icon: MapPin, done: booking.status === 'completed' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    active: 'نشط',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">تتبع الطلب</h1>
          <p className="text-muted-foreground">حجز #{booking.id?.slice(0, 8)}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{booking.product_name || 'منتج'}</CardTitle>
              <Badge className={statusColors[booking.status] || ''}>
                {statusLabels[booking.status] || booking.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">تاريخ البدء</p>
                <p className="font-medium">{new Date(booking.start_date).toLocaleDateString('ar-DZ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">تاريخ الانتهاء</p>
                <p className="font-medium">{new Date(booking.end_date).toLocaleDateString('ar-DZ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">المبلغ الإجمالي</p>
                <p className="font-medium text-sovereign-gold">{booking.total_price?.toLocaleString()} د.ج</p>
              </div>
              <div>
                <p className="text-muted-foreground">الحالة</p>
                <p className="font-medium">{statusLabels[booking.status] || booking.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              مراحل التتبع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className="flex items-center gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${stage.done ? 'bg-sovereign-gold/20 text-sovereign-gold' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${stage.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {stage.label}
                      </p>
                    </div>
                    {stage.done && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {index < stages.length - 1 && (
                      <div className={`absolute right-5 top-10 w-0.5 h-8 ${stage.done ? 'bg-sovereign-gold/30' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}