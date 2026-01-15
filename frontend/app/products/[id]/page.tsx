'use client';

import * as React from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { productsApi, bookingsApi, reviewsApi, hygieneApi, warrantiesApi } from '@/lib/api';
import { Star, ShoppingCart, Calendar, MapPin, Shield, Sparkles, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BookingCalendar } from '@/components/booking-calendar';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { ReviewList } from '@/components/reviews/review-list';
import { ReviewForm } from '@/components/reviews/review-form';
import { RatingStars } from '@/components/reviews/rating-stars';
import { WaitlistButton } from '@/components/waitlist-button';
import { trackProductView, trackAddToCart } from '@/lib/analytics';
import { BundleSelector } from '@/components/bundle-selector';
import { AccessorySuggestions } from '@/components/accessory-suggestions';
import { ProductRecommendations } from '@/components/product-recommendations';
import { ShareButton } from '@/components/share-button';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import { MagneticButton } from '@/components/ui/magnetic-button';
import { TiltCard } from '@/components/ui/tilt-card';
import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.id as string;
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug).catch(() => productsApi.getById(slug)).then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full border-t-4 border-gala-purple animate-spin"></div>
          <p className="text-gala-purple animate-pulse font-bold">جاري كشف الجمال...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ParticleField />
        <div className="text-center z-10 card-glass p-12 rounded-3xl max-w-md">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">404</h1>
          <p className="text-muted-foreground mb-6">عذراً، لم نتمكن من العثور على هذه القطعة الفريدة.</p>
          <MagneticButton asChild>
            <Link href="/products">العودة للكتالوج</Link>
          </MagneticButton>
        </div>
      </div>
    );
  }

  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [selectedStartDate, setSelectedStartDate] = React.useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = React.useState<Date | null>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const primaryImage = product.images?.find((img: any) => img.is_primary)?.image ||
    product.images?.[0]?.image ||
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&auto=format&fit=crop';

  // Prepare images for Lightbox
  const lightboxImages = React.useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return [{ src: primaryImage, alt: product.name_ar }];
    }
    return product.images.map((img: any) => ({
      src: img.image,
      alt: img.alt_text || `${product.name_ar} - ${img.id}`,
    }));
  }, [product.images, primaryImage, product.name_ar]);

  const addToCartMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('تم إضافة المنتج إلى السلة');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء إضافة المنتج');
    },
  });

  const handleAddToCart = () => {
    if (!selectedStartDate || !selectedEndDate) {
      toast.error('يرجى اختيار تواريخ الكراء');
      return;
    }

    addToCartMutation.mutate({
      product_id: product.id,
      start_date: selectedStartDate.toISOString().split('T')[0],
      end_date: selectedEndDate.toISOString().split('T')[0],
    });
  };

  const { data: hygieneData } = useQuery({
    queryKey: ['hygiene', product.id],
    queryFn: () => hygieneApi.getLatestForProduct(product.id).then((res: any) => res.data),
    enabled: !!product.id,
  });

  const { data: warrantyPlans } = useQuery({
    queryKey: ['warranties'],
    queryFn: () => warrantiesApi.getPlans().then((res: any) => res.data),
  });

  React.useEffect(() => {
    trackProductView(product.id, product.name_ar);
  }, [product]);

  return (
    <div className="relative min-h-screen pb-20">
      <ParticleField />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-12 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <TiltCard className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl cursor-pointer hover:glow-purple group shadow-2xl">
              <div
                className="w-full h-full"
                onClick={() => {
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
              >
                <Image
                  src={primaryImage}
                  alt={product.name_ar}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-4 rounded-full bg-white/20 backdrop-blur-md">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </TiltCard>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(0, 4).map((image: any, index: number) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="relative aspect-square overflow-hidden rounded-2xl cursor-pointer border-2 border-transparent hover:border-gala-purple transition-all duration-300 shadow-lg"
                    onClick={() => {
                      const actualIndex = product.images.findIndex((img: any) => img.id === image.id || img.image === image.image);
                      setLightboxIndex(actualIndex >= 0 ? actualIndex : index);
                      setLightboxOpen(true);
                    }}
                  >
                    <Image
                      src={image.image}
                      alt={`${product.name_ar} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              {product.category && (
                <Badge className="bg-gradient-to-r from-gala-purple to-gala-pink text-white border-0 px-4 py-1">
                  {product.category.name_ar}
                </Badge>
              )}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h1 
                  className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent pb-2 flex-1 min-w-0"
                  id="product-title"
                >
                  {product.name_ar}
                </h1>
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  title={product.name_ar}
                  description={product.description_ar || product.description}
                  image={primaryImage}
                  variant="outline"
                  size="sm"
                />
              </div>
              {product.rating && typeof product.rating === 'number' && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-white/5 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">{Number(product.rating).toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground font-medium">({product.total_rentals || 0} تأجير ناجح)</span>
                </div>
              )}
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-animated opacity-5 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-4xl font-black bg-gradient-to-r from-gala-cyan to-gala-purple bg-clip-text text-transparent">
                    {Number(product.price_per_day || 0).toLocaleString('ar-DZ')} دج
                  </p>
                  <p className="text-muted-foreground font-medium">للكراء اليومي الاستثنائي</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-gala-gold/10 border border-gala-gold/20">
                  <Sparkles className="w-8 h-8 text-gala-gold animate-pulse" />
                  <span className="text-xs font-bold text-gala-gold block mt-1 uppercase tracking-tighter">GALA EXCLUSIVE</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur card-glass flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gala-purple/20 flex items-center justify-center text-gala-purple">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase opacity-70">الحجم</p>
                  <p className="font-bold">{product.size}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur card-glass flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gala-pink/20 flex items-center justify-center text-gala-pink">
                  <div
                    className="w-5 h-5 rounded-full border border-white/20"
                    style={{ backgroundColor: product.color_hex || '#fff' }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase opacity-70">اللون</p>
                  <p className="font-bold">{product.color}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl card-glass border-0 overflow-hidden relative group">
              <div className="absolute inset-0 bg-white/5 opacity-50" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest">تفاصيل القطعة</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-lg">
                  {product.description_ar || product.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex flex-col gap-2 w-full">
                <MagneticButton
                  size="lg"
                  className={cn(
                    "w-full h-16 text-xl font-bold shadow-2xl transition-all duration-500",
                    product.status === 'available'
                      ? "shadow-gala-purple/20 bg-gradient-to-r from-gala-purple to-gala-pink hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-muted text-muted-foreground grayscale cursor-not-allowed shadow-none"
                  )}
                  onClick={handleAddToCart}
                  disabled={product.status !== 'available'}
                  withConfetti={!!selectedStartDate && !!selectedEndDate}
                >
                  <ShoppingCart className="h-6 w-6 ml-3" />
                  {product.status !== 'available'
                    ? 'القطعة محجوزة حالياً'
                    : (!selectedStartDate || !selectedEndDate)
                      ? 'حددوا تواريخ التألق'
                      : 'أضف إلى السلة'
                  }
                </MagneticButton>
                {product.status === 'available' && (!selectedStartDate || !selectedEndDate) && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-gala-pink font-bold text-center animate-pulse"
                  >
                    * يرجى اختيار التواريخ من التقويم أدناه للمتابعة
                  </motion.p>
                )}
              </div>
              <MagneticButton
                size="lg"
                variant="outline"
                className="w-full h-16 text-xl font-bold border-2 border-white/10 backdrop-blur-md hover:bg-white/5"
              >
                <Calendar className="h-6 w-6 ml-3 text-gala-purple" />
                احجز الآن
              </MagneticButton>
            </div>

            <div className="grid grid-cols-3 gap-6 py-8 border-y border-white/10">
              <motion.div whileHover={{ y: -5 }} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gala-cyan/10 flex items-center justify-center mx-auto mb-3 text-gala-cyan shadow-inner">
                  <MapPin className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold">توصيل سريع</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gala-purple/10 flex items-center justify-center mx-auto mb-3 text-gala-purple shadow-inner">
                  <Calendar className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold">حجز مرن</p>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-gala-gold/10 flex items-center justify-center mx-auto mb-3 text-gala-gold shadow-inner">
                  <Shield className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold">ضمان Gala</p>
              </motion.div>
            </div>

            {/* Bundles */}
            <BundleSelector
              productId={product.id}
              startDate={selectedStartDate}
              endDate={selectedEndDate}
              onSelectBundle={(bundleId: number) => {
                toast.success('تم إضافة الباقة إلى السلة');
              }}
            />
          </motion.div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-20 space-y-8 container mx-auto relative z-10 px-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ProductRecommendations productId={product.id} limit={6} />
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 space-y-8 container mx-auto relative z-10 px-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">التقييمات والمراجعات</span>
                  {product.rating && typeof product.rating === 'number' && (
                    <div className="flex items-center gap-3">
                      <RatingStars rating={Number(product.rating)} showValue size="lg" />
                      <span className="text-lg text-muted-foreground">
                        ({product.total_rentals || 0} تقييم)
                      </span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <ProductReviews productId={product.id} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxImages}
        plugins={[Zoom, Counter, Thumbnails]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
        thumbnails={{
          position: 'bottom',
          width: 120,
          height: 80,
          border: 0,
          borderRadius: 4,
          padding: 4,
          gap: 16,
        }}
        counter={{
          container: {
            style: {
              top: 'unset',
              bottom: 0,
              left: 0,
              right: 'unset',
            },
          },
        }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, .9)' },
        }}
      />
    </div>
  );
}

function ProductReviews({ productId }: { productId: number }) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.getAll({ product: productId }).then((res) => res.data),
  });

  const { isAuthenticated } = useAuthStore();
  const [showForm, setShowForm] = React.useState(false);

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">جاري تحميل التقييمات...</div>;
  }

  const results = reviews?.results || reviews || [];

  return (
    <div className="space-y-6">
      {isAuthenticated && (
        <div className="flex justify-end">
          {!showForm ? (
            <MagneticButton onClick={() => setShowForm(true)} variant="outline" size="sm">
              إضافة تقييم
            </MagneticButton>
          ) : (
            <Card className="bg-white/5 border-white/10 w-full">
              <CardHeader>
                <CardTitle>أضف تقييمك</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  productId={productId}
                  onSuccess={() => setShowForm(false)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <ReviewList reviews={results} productId={productId} />
    </div>
  );
}
