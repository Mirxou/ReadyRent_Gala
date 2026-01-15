'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ShoppingCart,
  Trash2,
  Calendar,
  Zap,
  Package,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { bookingsApi, packagingApi, locationsApi } from '@/lib/api';
import { trackBooking } from '@/lib/analytics';
import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';
import { MagneticButton } from '@/components/ui/magnetic-button';

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sameDayDelivery, setSameDayDelivery] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => bookingsApi.getCart().then((res) => res.data),
  });

  // Get user's default address to determine delivery zone
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => locationsApi.getMyAddresses().then((res) => res.data),
  });

  // Determine delivery zone from default address using useMemo (Professor 0 approved)
  const deliveryZoneId = React.useMemo(() => {
    if (addresses && Array.isArray(addresses)) {
      const defaultAddress = addresses.find((addr: any) => addr.is_default);
      return defaultAddress?.delivery_zone || null;
    }
    return null;
  }, [addresses]);

  // Check same-day delivery availability
  const { data: sameDayInfo } = useQuery({
    queryKey: ['same-day-delivery', deliveryZoneId],
    queryFn: () => locationsApi.checkSameDayDelivery(deliveryZoneId!).then((res) => res.data),
    enabled: !!deliveryZoneId,
  });

  React.useEffect(() => {
    if (sameDayInfo && !sameDayInfo.available) {
      setSameDayDelivery(false);
    }
  }, [sameDayInfo]);

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: number) => bookingsApi.removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('تم حذف المنتج من السلة');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المنتج');
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: () => bookingsApi.createBookingFromCart({
      same_day_delivery: sameDayDelivery,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      // Get the first booking ID to redirect to checkout
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        const booking = data.data[0];
        // Redirect to checkout with booking ID
        router.push(`/checkout?booking_id=${booking.id}`);
      } else {
        // If no booking ID, redirect to checkout without booking
        router.push('/checkout');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء إنشاء الحجز');
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full border-t-4 border-gala-purple animate-spin"></div>
          <p className="text-gala-purple animate-pulse font-bold">جاري استرجاع سلتكم الأنيقة...</p>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const totalPrice = items.reduce((sum: number, item: any) => {
    const days = Math.ceil(
      (new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) /
      (1000 * 60 * 60 * 24)
    ) + 1;
    return sum + (item.product.price_per_day * days * item.quantity);
  }, 0);

  // Get packaging suggestions for first item (if available)
  const firstItem = items[0];
  const rentalDays = firstItem ? Math.ceil(
    (new Date(firstItem.end_date).getTime() - new Date(firstItem.start_date).getTime()) /
    (1000 * 60 * 60 * 24)
  ) + 1 : 0;

  const { data: packagingInfo } = useQuery({
    queryKey: ['packaging-suggestion', firstItem?.product?.id, rentalDays],
    queryFn: () => packagingApi.getSuggestedForBooking({
      product_id: firstItem?.product?.id,
      rental_days: rentalDays
    }).then((res) => res.data),
    enabled: !!firstItem?.product?.id,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ParticleField />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 card-glass p-12 rounded-[2.5rem] max-w-lg mx-4"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-gala-purple to-gala-pink rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <ShoppingCart className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">سلتكم اللطيفة فارغة</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            يبدو أنكم لم تختاروا بعد ما يناسب تألقكم في مناسبتكم القادمة.
          </p>
          <MagneticButton asChild size="lg" className="px-8">
            <Link href="/products">اكتشفوا المجموعة الكاملة</Link>
          </MagneticButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      <ParticleField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-12 relative z-10"
      >
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent">
            حقيبة أناقتكم
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            أنتم على بعد خطوة واحدة من التألق المطلق
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {items.map((item: any, index: number) => {
                const days = Math.ceil(
                  (new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) /
                  (1000 * 60 * 60 * 24)
                ) + 1;
                const itemTotal = item.product.price_per_day * days * item.quantity;
                const primaryImage = item.product.primary_image ||
                  item.product.images?.[0]?.image ||
                  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&auto=format&fit=crop';

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -50 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="card-glass border-0 overflow-hidden group">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row gap-6">
                          <div className="relative w-full sm:w-48 h-64 sm:h-48 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                            <Image
                              src={primaryImage}
                              alt={item.product.name_ar}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </div>

                          <div className="flex-1 p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                {item.product.category && (
                                  <Badge className="mb-2 bg-gala-purple/10 text-gala-purple border-gala-purple/20">
                                    {item.product.category.name_ar}
                                  </Badge>
                                )}
                                <h3 className="font-bold text-2xl group-hover:text-gala-purple transition-colors">{item.product.name_ar}</h3>
                              </div>
                              <MagneticButton
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                onClick={() => removeFromCartMutation.mutate(item.id)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </MagneticButton>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 text-muted-foreground bg-white/5 p-3 rounded-2xl border border-white/10">
                                <Calendar className="h-5 w-5 text-gala-purple" />
                                <span className="text-sm font-medium">
                                  {formatDate(item.start_date)} - {formatDate(item.end_date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground bg-white/5 p-3 rounded-2xl border border-white/10">
                                <div className="w-5 h-5 rounded-full bg-gala-gold/20 flex items-center justify-center text-gala-gold">
                                  <Zap className="h-3 w-3" />
                                </div>
                                <span className="text-sm font-medium">
                                  {days} {days === 1 ? 'يوم' : 'أيام'} كراء
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="text-sm font-bold opacity-60">
                                {item.quantity} {item.quantity === 1 ? 'قطعة فريدة' : 'قطع'}
                              </div>
                              <div className="text-2xl font-black bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">
                                {itemTotal.toLocaleString('ar-DZ')} دج
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="card-glass border-0 rounded-[2.5rem] overflow-hidden sticky top-24">
              <div className="p-8 space-y-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">ملخص الجمال</h2>

                <div className="space-y-4">
                  {items.map((item: any) => {
                    const days = Math.ceil(
                      (new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                    ) + 1;
                    const itemTotal = item.product.price_per_day * days * item.quantity;
                    return (
                      <div key={item.id} className="flex justify-between items-center text-sm font-medium">
                        <span className="text-muted-foreground">{item.product.name_ar}</span>
                        <span className="text-white">{itemTotal.toLocaleString('ar-DZ')} دج</span>
                      </div>
                    );
                  })}
                </div>

                {packagingInfo?.suggested_packaging && (
                  <div className="p-4 bg-gala-gold/5 border border-gala-gold/20 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gala-gold/20 flex items-center justify-center text-gala-gold">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gala-gold">تغليف Gala الفاخر</p>
                      <p className="text-xs text-gala-gold/80 font-medium">
                        {packagingInfo.suggested_packaging.name_ar || packagingInfo.suggested_packaging.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Same-day Delivery Option */}
                {sameDayInfo?.available && (
                  <div className="p-4 bg-gala-cyan/5 border border-gala-cyan/20 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="same-day-delivery"
                          checked={sameDayDelivery}
                          onCheckedChange={setSameDayDelivery}
                          className="data-[state=checked]:bg-gala-cyan"
                        />
                        <Label htmlFor="same-day-delivery" className="cursor-pointer font-bold text-gala-cyan flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          تسليم سريع اليوم
                        </Label>
                      </div>
                      {sameDayInfo.fee > 0 && (
                        <span className="text-sm font-black text-gala-cyan">
                          +{sameDayInfo.fee.toLocaleString('ar-DZ')} دج
                        </span>
                      )}
                    </div>
                    {sameDayInfo.cutoff_time && (
                      <p className="text-xs text-gala-cyan/70 font-bold uppercase tracking-tighter">
                        أطلب قبل {sameDayInfo.cutoff_time} للتوصيل الليلة
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-8 border-t border-white/10 space-y-4">
                  {sameDayDelivery && sameDayInfo && sameDayInfo.fee > 0 && (
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground font-bold">رسوم السرعة القصوى</span>
                      <span className="text-gala-cyan">{sameDayInfo.fee.toLocaleString('ar-DZ')} دج</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold opacity-60">المبلغ الإجمالي</span>
                    <span className="text-4xl font-black bg-gradient-to-r from-gala-gold to-gala-gold/60 bg-clip-text text-transparent">
                      {(totalPrice + (sameDayDelivery && sameDayInfo ? sameDayInfo.fee : 0)).toLocaleString('ar-DZ')} دج
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <MagneticButton
                    className="w-full h-16 text-xl font-bold shadow-2xl shadow-gala-gold/20 bg-gradient-to-r from-gala-gold to-yellow-500 text-black border-0"
                    size="lg"
                    onClick={() => createBookingMutation.mutate()}
                    disabled={createBookingMutation.isPending}
                    withConfetti
                  >
                    {createBookingMutation.isPending ? (
                      'جاري التألق...'
                    ) : (
                      <>
                        تأكيد الحجز الملكي
                        <ArrowRight className="h-6 w-6 mr-3" />
                      </>
                    )}
                  </MagneticButton>

                  <MagneticButton variant="ghost" className="w-full h-12 font-bold text-muted-foreground hover:text-white" asChild>
                    <Link href="/products">متابعة تصفح الجمال</Link>
                  </MagneticButton>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

