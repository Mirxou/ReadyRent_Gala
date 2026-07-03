"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productsApi, bookingsApi, authApi, reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { 
  ShieldCheck, 
  Star, 
  Share2, 
  MapPin, 
  Sparkles, 
  LockKeyhole, 
  CheckCircle2, 
  Info,
  Clock,
  Palette,
  Scissors,
  Ruler,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { cn, formatNumber, formatNumber } from '@/lib/utils';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import { toast } from 'sonner';
import { SovereignCalendar } from '@/shared/components/sovereign/sovereign-calendar';
import { IdentityShield } from '@/shared/components/sovereign/identity-shield';
import { SovereignCheckoutModal } from '@/components/checkout/sovereign-checkout-modal';
import { TrustAssuranceChips } from '@/shared/components/sovereign/trust-assurance-chips';
import { HygieneProfile } from '@/shared/components/sovereign/hygiene-profile';
import { SovereignSparkle, SovereignGlow } from '@/shared/components/sovereign/sovereign-sparkle';
import { ProductHeartbeat } from '@/features/analytics/components/product-heartbeat';
import { ReviewList } from '@/components/reviews/review-list';
import { ReviewForm } from '@/components/reviews/review-form';
import { ProductRecommendations } from '@/components/product-recommendations';

export default function ProductDetailsPage() {
  const { id: slug } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Data Fetching
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug as string).catch(() => productsApi.getById(slug as string)).then((res) => res.data),
  });

  const { data: depositData } = useQuery({
    queryKey: ['deposit', product?.id],
    queryFn: () => bookingsApi.calculateDeposit(product!.id).then((res) => res.data),
    enabled: !!product?.id && isAuthenticated,
  });

  const { data: productReviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => reviewsApi.listForProduct(product!.id).then(r => r.data),
    enabled: !!product?.id,
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.create(data),
    onSuccess: () => {
      toast.success('تم إبرام العقد السيادي بنجاح (Contract Sealed)');
      setIsCheckoutOpen(false);
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

  const handleSovereignConfirm = (signatureData: string, artisanId?: number) => {
    if (!product || !selectedStartDate || !selectedEndDate) return;
    createBookingMutation.mutate({
      product_id: product.id,
      start_date: selectedStartDate.toISOString().split('T')[0],
      end_date: selectedEndDate.toISOString().split('T')[0],
      signature_proof: signatureData,
      artisan_id: artisanId,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-sovereign-gold">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-2xl font-black tracking-widest uppercase mb-4">
          Standard
        </motion.div>
        <span className="text-xs text-muted-foreground animate-pulse font-mono tracking-widest">جاري البحث في سجل الأصول...</span>
      </div>
    );
  }

  if (!product) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-muted-foreground">
          <ShieldCheck className="w-12 h-12 opacity-20 mb-4" />
          <h2 className="text-xl font-bold">لم يتم العثور على المنتج</h2>
        </div>
    );
  }

  const trustScore = depositData?.trust_score ?? user?.trust_score ?? 0;
  const isSovereign = depositData ? !depositData.deposit_required : (trustScore >= 80);
  const isVerified = depositData?.is_verified ?? user?.is_verified ?? false;
  const primaryImage = product.images?.find((img: any) => img.is_primary)?.image || product.images?.[0]?.image || product.image || '';
  const lightboxImages = product.images?.map((img: any) => ({ src: img.image })) || [{ src: primaryImage }];

  return (
    <div className="relative min-h-screen pb-20 bg-background overflow-hidden text-right" dir="rtl">
      
      {/* Background Ambience (Fabulous Layer) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-sovereign-blue/5 rounded-full blur-[140px] opacity-40 animate-pulse" />
        <div className="absolute bottom-1/2 right-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[140px] opacity-30" />
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10 space-y-20">
        
        {/* Navigation Context */}
        <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-sovereign-gold transition-colors font-black uppercase tracking-widest text-[10px] group">
           <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> العودة لسجل الأصول الاستباقي
        </Link>

        {/* 🏆 The Sovereign Masterpiece Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          {/* IMAGE AUTHORITY (Span 6) */}
          <div className="lg:col-span-6 space-y-8">
            <SovereignGlow color="gold">
              <div 
                className="aspect-[3/4] rounded-[4rem] overflow-hidden bg-white/5 border border-white/10 shadow-3xl shadow-sovereign-gold/10 relative group cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              >
                <Image src={primaryImage} alt={product.name_ar} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" priority />
                
                {/* Elite Overlay */}
                <div className="absolute top-10 right-10">
                   <SovereignSparkle active={product.is_premium}>
                      <Badge className="bg-sovereign-gold text-black font-black px-8 py-3 text-sm rounded-2xl shadow-2xl tracking-widest uppercase">
                        {product.is_premium ? 'متميز' : 'معتمد'}
                      </Badge>
                   </SovereignSparkle>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-10 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sovereign-gold mb-2">المصدر</p>
                    <h3 className="text-2xl font-black text-white italic">{product.name_ar}</h3>
                </div>
              </div>
            </SovereignGlow>

            {/* Gallery Fluid Scroller */}
            {product.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {product.images.map((img: any, idx: number) => (
                  <motion.div 
                    key={img.id} 
                    whileHover={{ y: -8 }}
                    className="flex-shrink-0 w-32 aspect-square rounded-[1.5rem] overflow-hidden cursor-pointer border-2 border-white/5 active:border-sovereign-gold transition-all" 
                    onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                  >
                    <Image src={img.image} alt="" fill className="object-cover" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* CONTRACT ENGINE (Span 6) */}
          <div className="lg:col-span-6 space-y-12">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-sovereign-gold/30 text-sovereign-gold px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-sovereign-gold/5">
                  التصنيف: {product.category?.name_ar || 'فاخر'}
                </Badge>
                <ShareButton title={product.name_ar} />
              </div>

              <h1 className="text-7xl font-black text-foreground tracking-tighter leading-tight italic">
                {product.name_ar}<span className="text-sovereign-gold">.</span>
              </h1>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 text-sovereign-gold">
                  <Star className="w-6 h-6 fill-current animate-pulse" />
                  <span className="text-2xl font-black font-mono">{Number(product.rating || 5).toFixed(1)}</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-white/20" />
                <span className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em]">{product.total_bookings || 0} حجز ناجح</span>
              </div>
            </div>

            {/* The Price & Trust Nexus */}
            <GlassPanel className="p-10 relative overflow-hidden group shadow-3xl shadow-sovereign-gold/5" gradientBorder>
              <div className="absolute top-0 right-0 w-48 h-48 bg-sovereign-gold/5 rounded-full blur-[80px]" />
              
              <div className="space-y-10 relative z-10">
                <div className="flex flex-col gap-6">
                    <ProductHeartbeat productId={product.id} className="opacity-80 scale-90 -mr-2" />
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">السعر لليوم</p>
                        <p className="text-6xl font-black tracking-tighter">
                          {formatNumber(product.price_per_day)} <span className="text-xl font-normal text-muted-foreground">دج</span>
                        </p>
                      </div>
                      <SovereignButton variant="primary" size="xl" className="px-16 h-20 shadow-2xl rounded-2xl text-xl" onClick={handleReserve} withShimmer>
                        إبرام الميثاق
                      </SovereignButton>
                    </div>
                </div>

                {/* Identity Shield Pulse */}
                <div className={cn(
                  "p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all duration-1000",
                  isSovereign ? "bg-sovereign-gold/10 border-sovereign-gold/30 shadow-inner" : "bg-white/5 border-white/5"
                )}>
                  <div className="flex items-center gap-5">
                    <IdentityShield status={isVerified ? "verified" : "pending"} showLabel={false} trustScore={trustScore} className="w-14 h-14" />
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider text-foreground">
                        {isSovereign ? "الوصول السيادي مفعل (Elite Access)" : "مستوى ميثاق قياسي"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 opacity-60 italic">تم إعفاء الضمان بناءً على سجل ثقتكم السيادي.</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassPanel>

            {/* FABULOUS: Trust Assurance & Protection Shield */}
            <div className="space-y-8 h-fit">
               <TrustAssuranceChips />
               
               <GlassPanel className="p-8 space-y-6 border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent" gradientBorder>
                  <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 flex items-center gap-3">
                         <ShieldCheck className="w-6 h-6" /> حماية الصك السيادي
                      </h4>
                      <Badge className="bg-emerald-500 text-black text-[9px] font-black uppercase px-3 py-1">الحماية مفعّلة</Badge>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1 p-5 bg-black/20 rounded-[1.5rem] border border-white/5 text-center group hover:bg-emerald-500/5 transition-all">
                        <p className="text-[10px] font-black uppercase mb-1 opacity-40 italic">أساسي</p>
                        <p className="text-xs font-bold">تأمين قياسي للأصل</p>
                     </div>
                     <div className="flex-1 p-5 bg-black/20 rounded-[1.5rem] border border-white/5 text-center group hover:bg-sovereign-gold/5 transition-all">
                        <p className="text-[10px] font-black uppercase mb-1 opacity-40 italic">ترقية</p>
                        <p className="text-xs font-bold text-sovereign-gold">الدرع الملكي الاستباقي</p>
                     </div>
                  </div>
               </GlassPanel>
            </div>
          </div>
        </div>

        {/* 📜 The Deep Narrative & Records (2nd Row) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 border-t border-white/5 pt-20">
          
          <div className="lg:col-span-8 space-y-20">
            {/* Asset Narrative */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold">
                    <Info className="w-6 h-6" />
                 </div>
                 <h3 className="text-3xl font-black italic">أصل سيادي: قصة المسار</h3>
              </div>
              <p className="text-2xl text-muted-foreground leading-relaxed font-light italic opacity-80 pl-10 border-l-2 border-sovereign-gold/20">
                {product.description_ar || product.description}
              </p>
            </section>
            
            {/* Hygiene Identity */}
            <section className="space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sovereign-blue/10 flex items-center justify-center text-sovereign-blue">
                     <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black italic">الهوية البيئية</h3>
               </div>
               <HygieneProfile record={product.hygiene_records?.[0]} />
            </section>

            {/* Sovereign Specifications */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
               {[
                  { label: 'اللون', value: product.color || 'ذهبي', icon: Palette },
                  { label: 'القماش', value: product.fabric || 'حرير فاخر', icon: Scissors },
                  { label: 'المقاس', value: product.size || 'مقاس قياسي', icon: Ruler },
                  { label: 'الحالة', value: 'ممتازة', icon: ShieldCheck }
               ].map((spec, i) => (
                  <div key={i} className="p-8 bg-white/5 rounded-[2rem] border border-white/5 group hover:border-sovereign-gold/20 transition-all">
                     <spec.icon className="w-6 h-6 text-sovereign-gold mb-6 group-hover:scale-110 transition-transform" />
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-50">{spec.label}</p>
                     <p className="text-sm font-black">{spec.value}</p>
                  </div>
               ))}
            </section>
          </div>

          {/* Sticky Calendar Hub (Span 4) */}
          <div className="lg:col-span-4 h-fit sticky top-28">
             <GlassPanel className="p-10 space-y-10 shadow-4xl shadow-black/40" gradientBorder>
                <div className="space-y-3">
                   <h4 className="text-lg font-black uppercase tracking-[0.3em] flex items-center gap-3">
                      <Clock className="w-6 h-6 text-sovereign-gold" /> تـجـمـيـد الـزمـن
                   </h4>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-40">حجز المواعيد</p>
                </div>

                <SovereignCalendar
                  productId={product.id}
                  pricePerDay={Number(product.price_per_day)}
                  onDateSelect={(start: Date | null, end: Date | null) => {
                    setSelectedStartDate(start);
                    setSelectedEndDate(end);
                  }}
                />
                
                <div className="pt-6 border-t border-white/5 space-y-4">
                   <p className="text-[10px] font-black text-muted-foreground uppercase text-center tracking-[0.3em] opacity-40">قائمة التحقق</p>
                   <TrustAssuranceChips />
                </div>
             </GlassPanel>
          </div>
        </div>

        {/* 📝 تقييمات العملاء (Reviews Section) */}
        {product?.id && (
          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sovereign-gold/10 flex items-center justify-center text-sovereign-gold">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-black italic">تقييمات العملاء</h3>
            </div>
            <GlassPanel className="p-10 space-y-10" gradientBorder>
              <div className="space-y-6">
                <ReviewList reviews={productReviews || []} productId={product.id} />
              </div>
              <div className="border-t border-white/5 pt-8">
                <h4 className="text-lg font-bold mb-6">أضف تقييمك</h4>
                <ReviewForm productId={product.id} />
              </div>
            </GlassPanel>
          </section>
        )}

        {/* ✨ Product Recommendations */}
        {product?.id && (
          <ProductRecommendations productId={product.id} />
        )}
      </div>

      <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} index={lightboxIndex} slides={lightboxImages} plugins={[Zoom]} />
      
      <SovereignCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={product}
        startDate={selectedStartDate}
        endDate={selectedEndDate}
        totalPrice={(selectedStartDate && selectedEndDate ? Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24)) : 0) * Number(product.price_per_day)}
        onConfirm={handleSovereignConfirm}
        isProcessing={createBookingMutation.isPending}
      />
    </div>
  );
}

function ShareButton({ title }: { title?: string }) {
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `ستاندرد: ${title}`,
          text: `اكتشف هذا الأصل الفاخر على منصة ستاندرد`,
          url: window.location.href,
        });
      } catch (err) { /* Share failed */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط');
    }
  };
  return (
    <button onClick={handleShare} className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted-foreground hover:text-sovereign-gold shadow-xl">
      <Share2 className="w-6 h-6" />
    </button>
  );
}
