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
  ArrowRight,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/utils';

import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { BranchSelector } from '@/components/branch-selector';
import { BundleSelector } from '@/components/bundle-selector';

class SafeWrapper extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sameDayDelivery, setSameDayDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => fetch('/api/bookings/cart').then(r => r.json()).then(d => d.data || d),
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: number) => fetch('/api/bookings/cart/items/' + itemId, { method: 'DELETE' }).then(r => r.json()),
    onMutate: async (itemId) => {
      // Cancel any outgoing refetchs (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart']);

      // Optimistically update to the new value
      if (previousCart) {
        queryClient.setQueryData(['cart'], (old: any) => ({
          ...old,
          items: old.items.filter((item: any) => item.id !== itemId),
        }));
      }

      // Return a context object with the snapshotted value
      return { previousCart };
    },
    onError: (err, itemId, context) => {
      // Rollback to the previous value if mutation fails
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      toast.error('حدث خطأ أثناء حذف المنتج');
    },
    onSettled: () => {
      // Final sync with server
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: () => {
      toast.success('تم حذف المنتج من السلة');
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: () => fetch('/api/bookings/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ same_day_delivery: sameDayDelivery }),
    }).then(r => r.json()),
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
      toast.error(error?.message || 'حدث خطأ أثناء إنشاء الحجز');
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full border-t-4 border-sovereign-gold animate-spin"></div>
          <p className="text-sovereign-gold animate-pulse font-bold">جاري استرجاع سلتكم الأنيقة...</p>
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

  // Get first item for packaging display
  const firstItem = items[0];

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
          <div className="w-24 h-24 bg-gradient-to-br from-sovereign-gold to-sovereign-gold rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <ShoppingCart className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sovereign-gold to-sovereign-gold bg-clip-text text-transparent">سلتكم اللطيفة فارغة</h2>
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
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-sovereign-gold via-sovereign-gold to-sovereign-gold bg-clip-text text-transparent">
            حقيبة أناقتكم
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            أنتم على بعد خطوة واحدة من التألق المطلق
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bundle upgrade at top of cart */}
            <SafeWrapper><BundleSelector startDate={null} endDate={null} /></SafeWrapper>

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
                                  <Badge className="mb-2 bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/20">
                                    {item.product.category.name_ar}
                                  </Badge>
                                )}
                                <h3 className="font-bold text-2xl group-hover:text-sovereign-gold transition-colors">{item.product.name_ar}</h3>
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
                                <Calendar className="h-5 w-5 text-sovereign-gold" />
                                <span className="text-sm font-medium">
                                  {formatDate(item.start_date)} - {formatDate(item.end_date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground bg-white/5 p-3 rounded-2xl border border-white/10">
                                <div className="w-5 h-5 rounded-full bg-sovereign-gold/20 flex items-center justify-center text-sovereign-gold">
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
                              <div className="text-2xl font-black bg-gradient-to-r from-sovereign-gold to-sovereign-gold bg-clip-text text-transparent">
                                {formatNumber(itemTotal)} دج
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
                <h2 className="text-3xl font-bold bg-gradient-to-r from-sovereign-gold to-sovereign-gold bg-clip-text text-transparent">ملخص الجمال</h2>

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
                        <span className="text-white">{formatNumber(itemTotal)} دج</span>
                      </div>
                    );
                  })}
                </div>

                {firstItem && (
                  <div className="p-4 bg-sovereign-gold/5 border border-sovereign-gold/20 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sovereign-gold/20 flex items-center justify-center text-sovereign-gold">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-sovereign-gold">تغليف Gala الفاخر</p>
                      <p className="text-xs text-sovereign-gold/80 font-medium">
                        تغليف أنيق يليق بمناسبتكم
                      </p>
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <MapPin className="h-4 w-4 text-sovereign-gold" />
                    <span>عنوان التوصيل</span>
                  </div>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="أدخل عنوان التوصيل الكامل..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-sovereign-gold/30 focus:border-sovereign-gold/30 transition-all"
                    dir="rtl"
                  />
                </div>

                {/* Same-day Delivery Option */}
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="same-day-delivery"
                        checked={sameDayDelivery}
                        onCheckedChange={setSameDayDelivery}
                        className="data-[state=checked]:bg-cyan-500"
                      />
                      <Label htmlFor="same-day-delivery" className="cursor-pointer font-bold text-cyan-500 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        تسليم سريع اليوم
                      </Label>
                    </div>
                    <span className="text-sm font-black text-cyan-500">
                      +500 دج
                    </span>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-4">
                  {sameDayDelivery && (
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground font-bold">رسوم السرعة القصوى</span>
                      <span className="text-cyan-500">500 دج</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold opacity-60">المبلغ الإجمالي</span>
                    <span className="text-4xl font-black bg-gradient-to-r from-sovereign-gold to-sovereign-gold/60 bg-clip-text text-transparent">
                      {formatNumber(totalPrice + (sameDayDelivery ? 500 : 0))} دج
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Branch selector near checkout */}
                  <SafeWrapper><BranchSelector /></SafeWrapper>
                  <MagneticButton
                    className="w-full h-16 text-xl font-bold shadow-2xl shadow-sovereign-gold/20 bg-gradient-to-r from-sovereign-gold to-yellow-500 text-black border-0"
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