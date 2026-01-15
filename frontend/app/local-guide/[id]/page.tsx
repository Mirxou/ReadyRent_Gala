'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { localGuideApi } from '@/lib/api';
import { MapPin, Star, Phone, Mail, Globe, MessageCircle, Clock } from 'lucide-react';
import { MapLocation } from '@/components/map-location';
import { RatingStars } from '@/components/reviews/rating-stars';
import Link from 'next/link';

export default function LocalServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;

  const { data: service, isLoading } = useQuery({
    queryKey: ['local-service', serviceId],
    queryFn: () => localGuideApi.getServiceById(Number(serviceId)).then((res) => res.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['service-reviews', serviceId],
    queryFn: () => localGuideApi.getReviews({ service: serviceId }).then((res) => res.data),
    enabled: !!serviceId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل تفاصيل الخدمة...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">الخدمة غير موجودة</p>
        </div>
      </div>
    );
  }

  const primaryImage = service.cover_image || service.logo || '/placeholder-service.jpg';
  const reviewsList = Array.isArray(reviews) ? reviews : (reviews?.results || []);

  const SERVICE_TYPE_LABELS: Record<string, string> = {
    venue: 'قاعة أفراح',
    photographer: 'مصور',
    videographer: 'مصور فيديو',
    mc: 'مقدم',
    caterer: 'مطعم',
    makeup_artist: 'فنان مكياج',
    hair_stylist: 'مصفف شعر',
    decorator: 'مصمم ديكور',
    dj: 'DJ',
    band: 'فرقة موسيقية',
    other: 'أخرى',
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-lg mb-6">
          <Image
            src={primaryImage}
            alt={service.name_ar || service.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              {service.is_verified && (
                <Badge variant="default">✓ موثق</Badge>
              )}
              {service.is_featured && (
                <Badge>مميز</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {service.name_ar || service.name}
            </h1>
            <Badge variant="secondary" className="mb-2">
              {SERVICE_TYPE_LABELS[service.service_type] || service.service_type}
            </Badge>
            {service.rating && (
              <div className="flex items-center gap-2">
                <RatingStars rating={Number(service.rating)} showValue size="lg" />
                <span className="text-sm">
                  ({service.review_count || 0} تقييم)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {service.description_ar && (
            <Card>
              <CardHeader>
                <CardTitle>عن الخدمة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {service.description_ar || service.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Images Gallery */}
          {service.images && service.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>معرض الصور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {service.images.map((image: any) => (
                    <div
                      key={image.id}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <Image
                        src={image.image}
                        alt={image.alt_text || service.name_ar}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>التقييمات والمراجعات</CardTitle>
            </CardHeader>
            <CardContent>
              {reviewsList.length > 0 ? (
                <div className="space-y-4">
                  {reviewsList.map((review: any) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{review.user_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <RatingStars rating={review.rating} size="sm" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>
                        {review.is_verified && (
                          <Badge variant="outline" className="text-xs">
                            ✓ موثق
                          </Badge>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  لا توجد تقييمات بعد
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات الاتصال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الهاتف</p>
                    <a
                      href={`tel:${service.phone}`}
                      className="font-semibold hover:text-primary"
                    >
                      {service.phone}
                    </a>
                  </div>
                </div>
              )}

              {service.whatsapp && (
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <a
                      href={`https://wa.me/${service.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-primary"
                    >
                      {service.whatsapp}
                    </a>
                  </div>
                </div>
              )}

              {service.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <a
                      href={`mailto:${service.email}`}
                      className="font-semibold hover:text-primary break-all"
                    >
                      {service.email}
                    </a>
                  </div>
                </div>
              )}

              {service.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الموقع الإلكتروني</p>
                    <a
                      href={service.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-primary break-all"
                    >
                      {service.website}
                    </a>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-2">
                <Button className="w-full" size="lg">
                  <Phone className="h-4 w-4 ml-2" />
                  اتصل الآن
                </Button>
                {service.whatsapp && (
                  <Button variant="outline" className="w-full" size="lg" asChild>
                    <a
                      href={`https://wa.me/${service.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 ml-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {service.latitude && service.longitude && (
            <Card>
              <CardHeader>
                <CardTitle>الموقع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{service.address}</p>
                    </div>
                  )}
                  <MapLocation
                    initialLat={Number(service.latitude)}
                    initialLng={Number(service.longitude)}
                    initialAddress={service.address}
                    readonly
                    height="300px"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Info */}
          {(service.price_range_min || service.price_range_max) && (
            <Card>
              <CardHeader>
                <CardTitle>نطاق الأسعار</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">
                    {service.price_range_min && service.price_range_max
                      ? `${service.price_range_min} - ${service.price_range_max} دج`
                      : service.price_range_min
                      ? `من ${service.price_range_min} دج`
                      : `حتى ${service.price_range_max} دج`}
                  </p>
                  {service.price_note && (
                    <p className="text-sm text-muted-foreground">{service.price_note}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

