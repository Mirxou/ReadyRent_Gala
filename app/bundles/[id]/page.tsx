'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package, Percent, CalendarDays, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { useState } from 'react';

export default function BundleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bundleId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const { data: res, isLoading } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => fetch(`/api/bundles/${bundleId}`).then(r => r.json()),
    enabled: !!bundleId,
  });

  const bundle = res?.data || res;

  const { data: priceRes, isLoading: calcLoading } = useQuery({
    queryKey: ['bundle-price', bundleId, startDate, endDate],
    queryFn: () =>
      fetch(`/api/bundles/${bundleId}/calculate-price?start_date=${startDate}&end_date=${endDate}`)
        .then(r => r.json()),
    enabled: !!startDate && !!endDate && !!bundleId,
  });

  const priceData = priceRes?.data || priceRes;

  const { mutate: bookBundle, isPending: isBooking } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bundles/${bundleId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ startDate, endDate, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'فشل حجز الباقة');
      return json;
    },
    onSuccess: () => {
      toast.success('تم حجز الباقة بنجاح!');
      router.push('/dashboard/orders');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'حدث خطأ أثناء الحجز');
    },
  });

  const handleBook = () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً');
      router.push('/login');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('يجب تحديد تواريخ البداية والنهاية');
      return;
    }
    bookBundle();
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sovereign-gold" />
            <p className="text-muted-foreground mt-4">جاري تحميل الباقة...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="relative min-h-screen">
        <ParticleField />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <Card className="card-glass border-0 rounded-3xl">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">الباقة غير موجودة</p>
              <Button asChild className="mt-4 bg-sovereign-gold text-black hover:bg-sovereign-gold/90">
                <Link href="/bundles">العودة للباقات</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const bundleName = bundle.nameAr || bundle.name;
  const bundleDesc = bundle.descriptionAr || bundle.description;
  const discount = bundle.discountPercentage || 0;
  const items = bundle.items || [];

  return (
    <div className="relative min-h-screen">
      <ParticleField />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" asChild className="mb-8 text-muted-foreground hover:text-white">
            <Link href="/bundles" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              العودة للباقات
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bundle Image */}
            <div>
              {bundle.image ? (
                <div className="relative w-full h-96 overflow-hidden rounded-3xl mb-4">
                  <img
                    src={bundle.image}
                    alt={bundleName}
                    className="w-full h-full object-cover"
                  />
                  {discount > 0 && (
                    <Badge className="absolute top-4 left-4 bg-sovereign-gold text-black text-lg px-4 py-2 font-bold">
                      <Percent className="h-4 w-4 ml-1" />
                      خصم {discount}%
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-64 rounded-3xl bg-gradient-to-br from-sovereign-gold/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <Package className="h-16 w-16 text-sovereign-gold/50" />
                  {discount > 0 && (
                    <Badge className="absolute top-4 left-4 bg-sovereign-gold text-black text-lg px-4 py-2 font-bold">
                      <Percent className="h-4 w-4 ml-1" />
                      خصم {discount}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-sovereign-gold via-yellow-300 to-sovereign-gold bg-clip-text text-transparent"
              >
                {bundleName}
              </h1>

              {bundleDesc && (
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {bundleDesc}
                </p>
              )}

              {/* Items count */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Package className="h-4 w-4" />
                <span>{items.length} منتجات في هذه الباقة</span>
                {bundle.validDays && (
                  <>
                    <span className="mx-2">•</span>
                    <CalendarDays className="h-4 w-4" />
                    <span>صالحة لمدة {bundle.validDays} أيام</span>
                  </>
                )}
              </div>

              {/* Booking Form */}
              <Card className="card-glass border-0 rounded-3xl mb-6">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-sovereign-gold" />
                    تحديد فترة الكراء
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">تاريخ البداية</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">تاريخ النهاية</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">ملاحظات (اختياري)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="ملاحظات إضافية..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sovereign-gold/50 resize-none"
                    />
                  </div>

                  {/* Price calculation */}
                  {priceData && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-sovereign-gold/10 border border-sovereign-gold/20 rounded-2xl p-4 space-y-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المدة:</span>
                        <span>{priceData.days} أيام</span>
                      </div>
                      {priceData.subtotal !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">المجموع قبل الخصم:</span>
                          <span className="line-through">{priceData.subtotal.toLocaleString()} دج</span>
                        </div>
                      )}
                      {priceData.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-400">
                          <span>الخصم ({discount}%):</span>
                          <span>-{priceData.discount.toLocaleString()} دج</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-sovereign-gold/20">
                        <span>الإجمالي:</span>
                        <span className="text-sovereign-gold">{(priceData.total || 0).toLocaleString()} دج</span>
                      </div>
                    </motion.div>
                  )}

                  {calcLoading && (
                    <div className="text-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-sovereign-gold" />
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-sovereign-gold to-yellow-500 text-black font-bold rounded-2xl h-14 text-lg hover:opacity-90 transition-opacity"
                    onClick={handleBook}
                    disabled={isBooking || !startDate || !endDate}
                  >
                    {isBooking ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 ml-2" />
                        حجز الباقة الآن
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bundle Items */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Package className="h-6 w-6 text-sovereign-gold" />
                منتجات الباقة ({items.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item: any, idx: number) => {
                  const product = item.product || {};
                  return (
                    <Link key={item.id} href={`/products/${item.productId || product.id}`}>
                      <Card className="card-glass border-0 rounded-2xl overflow-hidden hover:border-sovereign-gold/30 transition-colors group cursor-pointer">
                        <div className="aspect-square bg-muted/30 relative overflow-hidden">
                          {product.primaryImage ? (
                            <img
                              src={product.primaryImage}
                              alt={product.nameAr || product.name || 'منتج'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          <Badge className="absolute top-2 right-2 bg-sovereign-gold/90 text-black text-xs">
                            #{idx + 1}
                          </Badge>
                        </div>
                        <CardContent className="pt-4 pb-4">
                          <h3 className="font-bold text-sm mb-1 line-clamp-1">
                            {product.nameAr || product.name || 'منتج'}
                          </h3>
                          <p className="text-sovereign-gold font-bold text-sm">
                            {(product.pricePerDay || 0).toLocaleString()} دج
                            <span className="text-muted-foreground font-normal mr-1">/يوم</span>
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}