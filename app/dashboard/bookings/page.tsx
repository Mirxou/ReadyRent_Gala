'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bookingsApi } from '@/lib/api';
import { Calendar, Clock, Package, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';

export default function BookingsPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsApi.getAll().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل الحجوزات...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'قيد الانتظار', variant: 'outline' },
      confirmed: { label: 'مؤكد', variant: 'default' },
      in_use: { label: 'قيد الاستخدام', variant: 'default' },
      completed: { label: 'مكتمل', variant: 'secondary' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center px-6 py-8 md:px-12 md:py-16"
          >
            <div className="mb-6">
              <h1 
                className="text-5xl md:text-7xl font-bold mb-6"
                style={{
                  background: 'linear-gradient(to right, #8B5CF6, #EC4899, #F59E0B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                  lineHeight: '1.1',
                  padding: '0.5rem 1rem',
                }}
              >
                حجوزاتي
              </h1>
            </div>
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">لا توجد حجوزات</h2>
              <p className="text-muted-foreground mb-6">
                لم تقم بحجز أي منتجات بعد
              </p>
              <Button asChild>
                <Link href="/products">تصفح المنتجات</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      <div className="container mx-auto px-4 py-12 relative z-10" style={{ overflow: 'visible' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
          style={{ 
            overflow: 'visible', 
            minWidth: '100%',
            padding: '4rem 6rem',
          }}
        >
          <div className="mb-6" style={{ overflow: 'visible', width: '100%' }}>
            <h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{
                background: 'linear-gradient(to right, #8B5CF6, #EC4899, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
                lineHeight: '1.5',
                padding: '2rem 6rem 2rem 1rem',
                margin: '0 auto',
                width: 'auto',
                maxWidth: '100%',
                overflow: 'visible',
                whiteSpace: 'nowrap',
              }}
            >
              حجوزاتي
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            {bookings.length} {bookings.length === 1 ? 'حجز' : 'حجوزات'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6">
        {bookings.map((booking: any) => {
          const primaryImage = booking.product.primary_image || 
                               booking.product.images?.[0]?.image || 
                               'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&auto=format&fit=crop';

          return (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative w-full md:w-32 h-40 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={primaryImage}
                      alt={booking.product.name_ar}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{booking.product.name_ar}</h3>
                        {booking.product.category && (
                          <p className="text-sm text-muted-foreground">
                            {booking.product.category.name_ar}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">من</p>
                          <p className="font-semibold">{formatDate(booking.start_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">إلى</p>
                          <p className="font-semibold">{formatDate(booking.end_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">المدة</p>
                          <p className="font-semibold">{booking.total_days} {booking.total_days === 1 ? 'يوم' : 'أيام'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">المجموع</p>
                          <p className="font-semibold text-lg text-primary">
                            {Number(booking.total_price).toFixed(0)} دج
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" asChild>
                        <Link href={`/products/${booking.product.slug || booking.product.id}`}>
                          عرض المنتج
                        </Link>
                      </Button>
                      {(booking.status === 'confirmed' || booking.status === 'in_use') && (
                        <Button variant="default" asChild>
                          <Link href={`/bookings/${booking.id}/tracking`}>
                            تتبع التسليم
                          </Link>
                        </Button>
                      )}
                      {booking.status === 'in_use' && (
                        <Button variant="default" asChild>
                          <Link href={`/returns/new?booking=${booking.id}`}>
                            طلب إرجاع
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      </div>
    </div>
  );
}

