'use client';

import { useQuery } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { GPSTracker } from '@/components/gps-tracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package } from 'lucide-react';

export default function TrackingPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => locationsApi.getMyDeliveries().then((res) => res.data),
  });

  // Find delivery for this booking
  const delivery = deliveries?.find((d: any) => d.booking?.id?.toString() === bookingId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل معلومات التتبع...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">لا توجد معلومات تتبع</h2>
          <p className="text-muted-foreground">
            لم يتم بدء عملية التسليم بعد
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">تتبع التسليم</h1>
        <p className="text-muted-foreground">
          تتبع موقع تسليم حجزك في الوقت الفعلي
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GPSTracker
          deliveryId={delivery.id}
          currentLat={delivery.current_latitude ? Number(delivery.current_latitude) : undefined}
          currentLng={delivery.current_longitude ? Number(delivery.current_longitude) : undefined}
          destinationLat={delivery.delivery_address?.latitude ? Number(delivery.delivery_address.latitude) : undefined}
          destinationLng={delivery.delivery_address?.longitude ? Number(delivery.delivery_address.longitude) : undefined}
          status={delivery.status}
        />

        <Card>
          <CardHeader>
            <CardTitle>تفاصيل التسليم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">المنتج</p>
              <p className="font-semibold">{delivery.booking?.product?.name_ar || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ التسليم</p>
              <p className="font-semibold">
                {delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString('ar-EG') : '-'}
              </p>
            </div>
            {delivery.delivery_address && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  عنوان التسليم
                </p>
                <p className="font-semibold">{delivery.delivery_address.full_address}</p>
                {delivery.delivery_address.city && (
                  <p className="text-sm text-muted-foreground">{delivery.delivery_address.city}</p>
                )}
              </div>
            )}
            {delivery.assigned_driver && (
              <div>
                <p className="text-sm text-muted-foreground">السائق</p>
                <p className="font-semibold">{delivery.assigned_driver.email || '-'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

