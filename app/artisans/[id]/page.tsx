'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { artisansApi } from '@/lib/api';
import { MapPin, Star, Phone, Mail, Instagram, Facebook, Palette } from 'lucide-react';
import { MapLocation } from '@/components/map-location';
import { RatingStars } from '@/components/reviews/rating-stars';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { useState } from 'react';

export default function ArtisanDetailPage() {
  const params = useParams();
  const artisanId = params.id as string;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: artisan, isLoading } = useQuery({
    queryKey: ['artisan', artisanId],
    queryFn: () => artisansApi.getById(Number(artisanId)).then((res) => res.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['artisan-reviews', artisanId],
    queryFn: () => artisansApi.getAll({ id: artisanId }).then((res) => res.data),
    enabled: !!artisanId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل تفاصيل الحرفية...</p>
        </div>
      </div>
    );
  }

  if (!artisan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">الحرفية غير موجودة</p>
        </div>
      </div>
    );
  }

  const coverImage = artisan.cover_image || artisan.profile_image || '/placeholder-artisan.jpg';
  const portfolioItems = artisan.portfolio_items || [];
  const reviewsList = reviews ? (Array.isArray(reviews) ? reviews : reviews.results || []) : [];

  const SPECIALTY_LABELS: Record<string, string> = {
    dress_designer: 'مصممة فساتين',
    accessories_designer: 'مصممة إكسسوارات',
    embroidery: 'تطريز',
    beading: 'خرز',
    tailor: 'خياطة',
    other: 'أخرى',
  };

  const lightboxImages = portfolioItems.map((item: any) => ({
    src: item.image,
    alt: item.title_ar || item.title,
  }));

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-lg mb-6">
          <Image
            src={coverImage}
            alt={artisan.name_ar || artisan.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              {artisan.is_verified && (
                <Badge variant="default">✓ موثقة</Badge>
              )}
              {artisan.is_featured && (
                <Badge>مميزة</Badge>
              )}
              <Badge variant="secondary">
                <Palette className="h-3 w-3 ml-1" />
                {SPECIALTY_LABELS[artisan.specialty] || artisan.specialty}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {artisan.name_ar || artisan.name}
            </h1>
            {artisan.rating && (
              <div className="flex items-center gap-2">
                <RatingStars rating={Number(artisan.rating)} showValue size="lg" />
                <span className="text-sm">
                  ({artisan.review_count || 0} تقييم)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {artisan.bio_ar && (
            <Card>
              <CardHeader>
                <CardTitle>نبذة عن الحرفية</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {artisan.bio_ar || artisan.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Portfolio */}
          {portfolioItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>معرض الأعمال</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolioItems.map((item: any, index: number) => (
                    <div
                      key={item.id}
                      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity group"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <Image
                        src={item.image}
                        alt={item.title_ar || item.title || 'معرض أعمال'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {item.is_featured && (
                        <Badge className="absolute top-2 left-2">مميز</Badge>
                      )}
                    </div>
                  ))}
                </div>

                <Lightbox
                  open={lightboxOpen}
                  close={() => setLightboxOpen(false)}
                  index={lightboxIndex}
                  slides={lightboxImages}
                  plugins={[Zoom]}
                  zoom={{
                    maxZoomPixelRatio: 3,
                    zoomInMultiplier: 2,
                  }}
                />
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
              {artisan.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الهاتف</p>
                    <a
                      href={`tel:${artisan.phone}`}
                      className="font-semibold hover:text-primary"
                    >
                      {artisan.phone}
                    </a>
                  </div>
                </div>
              )}

              {artisan.whatsapp && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <a
                      href={`https://wa.me/${artisan.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-primary"
                    >
                      {artisan.whatsapp}
                    </a>
                  </div>
                </div>
              )}

              {artisan.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <a
                      href={`mailto:${artisan.email}`}
                      className="font-semibold hover:text-primary break-all"
                    >
                      {artisan.email}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t">
                {artisan.instagram && (
                  <a
                    href={`https://instagram.com/${artisan.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-pink-600 transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                )}
                {artisan.facebook && (
                  <a
                    href={artisan.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button className="w-full" size="lg">
                  <Phone className="h-4 w-4 ml-2" />
                  اتصل الآن
                </Button>
                {artisan.whatsapp && (
                  <Button variant="outline" className="w-full" size="lg" asChild>
                    <a
                      href={`https://wa.me/${artisan.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Phone className="h-4 w-4 ml-2" />
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {artisan.latitude && artisan.longitude && (
            <Card>
              <CardHeader>
                <CardTitle>الموقع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {artisan.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{artisan.address}</p>
                    </div>
                  )}
                  <MapLocation
                    initialLat={Number(artisan.latitude)}
                    initialLng={Number(artisan.longitude)}
                    initialAddress={artisan.address}
                    readonly
                    height="300px"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>الإحصائيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التقييم</span>
                  <span className="font-semibold">
                    {artisan.rating ? Number(artisan.rating).toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد التقييمات</span>
                  <span className="font-semibold">{artisan.review_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد المشاريع</span>
                  <span className="font-semibold">{artisan.project_count || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

