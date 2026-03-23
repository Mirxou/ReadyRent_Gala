"use client";

import * as React from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { SovereignButton } from '@/components/sovereign/sovereign-button';
import { GlassPanel } from '@/components/sovereign/glass-panel';
import { IdentityShield } from '@/components/sovereign/identity-shield';
import { productsApi, bookingsApi, hygieneApi } from '@/lib/api';
import { Star, ShieldCheck, MapPin, LockKeyhole, Info, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BookingCalendar } from '@/components/booking-calendar';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import { TrustAssuranceChips } from '@/components/product/trust-chips';
import { SovereignCheckoutModal } from '@/components/checkout/sovereign-checkout-modal';

export default function SovereignProductPage() {
  const params = useParams();
  const slug = params.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedStartDate, setSelectedStartDate] = React.useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = React.useState<Date | null>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  // Data Fetching
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug).catch(() => productsApi.getById(slug)).then((res) => res.data),
  });

  const { data: hygieneData } = useQuery({
    queryKey: ['hygiene', product?.id],
    queryFn: () => hygieneApi.getLatestForProduct(product!.id).then((res: any) => res.data),
    enabled: !!product?.id,
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.create(data),
    onSuccess: () => {
      toast.success('تم إبرام العقد السيادي بنجاح (Contract Sealed)');
      setIsCheckoutOpen(false);
      // In a real app, redirect to dashboard
      // router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل في توثيق العقد');
    },
  });

  const handleReserve = () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول لبدء معاملة سيادية');
      return;
    }
    if (!selectedStartDate || !selectedEndDate) {
      toast.error('يجب تحديد مدة العقد أولاً');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleSovereignConfirm = (signatureData: string) => {
    if (!product || !selectedStartDate || !selectedEndDate) return;

    createBookingMutation.mutate({
      product_id: product.id,
      start_date: selectedStartDate.toISOString().split('T')[0],
      end_date: selectedEndDate.toISOString().split('T')[0],
      signature_proof: signatureData,
    });
  };

  // Calculate Total Price for Modal
  const days = selectedStartDate && selectedEndDate
    ? Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = days * Number(product?.price_per_day || 0);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-sovereign-gold animate-pulse">Initializing Standard Asset...</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Asset Not Found</div>;
  }

  const { data: depositData } = useQuery({
    queryKey: ['deposit', product?.id],
    queryFn: () => bookingsApi.calculateDeposit(product!.id).then((res) => res.data),
    enabled: !!product?.id && isAuthenticated,
  });

  // Logic: Sovereign Trust Assessment
  const trustScore = depositData?.trust_score ?? user?.trust_score ?? 0;
  const isSovereign = depositData ? !depositData.deposit_required : (trustScore >= 80);
  const isVerified = depositData?.is_verified ?? user?.is_verified ?? false;

  const primaryImage = product?.images?.find((img: any) => img.is_primary)?.image || product?.images?.[0]?.image || '';
  const lightboxImages = product.images?.map((img: any) => ({ src: img.image })) || [{ src: primaryImage }];

  return (
    <div className="relative min-h-screen pb-20 bg-background overflow-hidden text-right" dir="rtl">

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sovereign-blue/5 rounded-full blur-[100px] opacity-30" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sovereign-gold/5 rounded-full blur-[100px] opacity-20" />
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* RIGHT COLUMN: Visual Authority (Images) - Span 7 */}
        <div className="lg:col-span-7 space-y-6">
          <GlassPanel className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-sovereign-gold/10 group cursor-pointer" onClick={() => setLightboxOpen(true)}>
            <Image
              src={primaryImage}
              alt={product.name_ar}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
            />

            {/* Sovereign Watermark */}
            <div className="absolute top-6 left-6 flex gap-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur text-foreground border-white/10">
                <Sparkles className="w-3 h-3 ml-1 text-sovereign-gold" />
                Standard Verified
              </Badge>
            </div>
          </GlassPanel>

          {/* Gallery Grid */}
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(0, 4).map((img: any, idx: number) => (
                <motion.div
                  key={img.id}
                  whileHover={{ y: -5 }}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 relative"
                  onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                >
                  <Image src={img.image} alt="" fill className="object-cover" />
                </motion.div>
              ))}
            </div>
          )}

          {/* Description - The Manuscript */}
          <GlassPanel className="p-8 mt-8">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-sovereign-gold" />
              مواصفات الأصل
            </h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-lg">
              {product.description_ar || product.description}
            </p>
          </GlassPanel>
        </div>

        {/* LEFT COLUMN: The Digital Contract (Span 5) */}
        <div className="lg:col-span-5 space-y-8 sticky top-24 h-fit">

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 text-[10px] uppercase tracking-widest border border-sovereign-gold/50 text-sovereign-gold rounded-full bg-sovereign-gold/5">
                {product.category?.name_ar || "Standard Asset"}
              </span>
              <ShareButton />
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">
              {product.name_ar}
            </h1>

            <div className="flex items-center gap-6 text-sm text-muted-foreground border-b border-border pb-6">
              <span className="flex items-center gap-1.5 min-w-fit">
                <MapPin className="w-4 h-4 text-sovereign-gold" />
                الجزائر العاصمة
              </span>
              <span className="flex items-center gap-1.5 min-w-fit">
                <Star className="w-4 h-4 text-sovereign-gold fill-sovereign-gold" />
                {Number(product.rating || 5).toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5 min-w-fit">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                {hygieneData ? "معقم ومجهز" : "جاهز للتسليم"}
              </span>
            </div>
          </div>

          {/* THE LOCKED PRICE ENGINE */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sovereign-gold to-sovereign-blue opacity-20 rounded-2xl blur group-hover:opacity-40 transition duration-1000"></div>
            <GlassPanel className="relative p-6 bg-background/90" gradientBorder>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                    <LockKeyhole className="w-3 h-3 text-sovereign-gold" /> القيمة المجمدة (Locked Price)
                  </p>

                  <div className="mb-4">
                    <TrustAssuranceChips />
                  </div>

                  <div className="text-5xl font-mono font-bold text-foreground tracking-tight">
                    {Number(product.price_per_day).toLocaleString('en-US')}
                    <span className="text-lg font-sans font-normal text-muted-foreground mr-2">دج / يوم</span>
                  </div>
                </div>
              </div>

              {/* Trust Assessment UI */}
              {isAuthenticated ? (
                <div className={cn(
                  "p-4 rounded-xl border mb-6 flex items-center justify-between",
                  isSovereign
                    ? "bg-sovereign-gold/5 border-sovereign-gold/20"
                    : "bg-sovereign-blue/5 border-sovereign-blue/10"
                )}>
                  <div className="flex items-center gap-3">
                    <IdentityShield status={isVerified ? "verified" : "pending"} showLabel={false} trustScore={trustScore} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {isSovereign ? "مستوى سيادي (High Trust)" : "مستوى قياسي (Standard)"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isSovereign ? "تم إعفاء الضمان بالكامل." : "يتطلب ضماناً بقيمة رمزية."}
                      </p>
                    </div>
                  </div>
                  {isSovereign && <CheckCircle2 className="w-5 h-5 text-sovereign-gold" />}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/5 mb-6 text-center">
                  <p className="text-xs text-muted-foreground">سجل الدخول لعرض تقييم الثقة الخاص بك</p>
                </div>
              )}

              <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent my-6" />

              {/* Date Selection */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">تحديد مدة العقد</p>
                <BookingCalendar
                  productId={product.id}
                  pricePerDay={Number(product.price_per_day)}
                  onDateSelect={(start, end) => {
                    setSelectedStartDate(start);
                    setSelectedEndDate(end);
                  }}
                />
              </div>

              {/* Action */}
              <div className="mt-8">
                <SovereignButton
                  size="xl"
                  className="w-full text-lg shadow-2xl shadow-sovereign-gold/10"
                  onClick={handleReserve}
                  disabled={!product.status || product.status !== 'available'}
                >
                  {isAuthenticated
                    ? (selectedStartDate && selectedEndDate ? "بدء إجراءات العقد" : "حدد التواريخ أولاً")
                    : "تسجيل الدخول للحجز"
                  }
                </SovereignButton>
                <p className="text-center text-[10px] text-muted-foreground mt-4 opacity-70">
                  بالضغط على هذا الزر، أنت توافق على شروط "العقد الذكي" لـ Standard.
                </p>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxImages}
        plugins={[Zoom]}
      />

      <SovereignCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={product}
        startDate={selectedStartDate}
        endDate={selectedEndDate}
        totalPrice={totalPrice}
        onConfirm={handleSovereignConfirm}
        isProcessing={createBookingMutation.isPending}
      />
    </div>
  );
}

function ShareButton() {
  return (
    <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
      <Share2 className="w-5 h-5" />
    </button>
  );
}
