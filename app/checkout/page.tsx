'use client'
import { formatNumber } from '@/lib/utils';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { paymentsApi, bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

import { ArrowLeft, CreditCard, Smartphone, Loader2, MapPin, ShieldCheck, ExternalLink } from 'lucide-react';
import { ParticleField } from '@/components/ui/particle-field';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WILAYAS } from '@/lib/dz-data';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  // Booking ID from URL (cart → checkout flow)
  const bookingId = searchParams.get('booking_id');

  // Webhook return status
  const returnStatus = searchParams.get('status'); // 'success' | 'failed'
  const returnPaymentId = searchParams.get('payment_id');

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedWilaya, setSelectedWilaya] = useState<string>('');
  const [apiPaymentError, setApiPaymentError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  // Handle webhook return
  const [webhookState, setWebhookState] = useState<'idle' | 'success' | 'failed'>('idle');
  const paymentCompleted = webhookState === 'success';
  const webhookError = webhookState === 'failed' ? 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.' : null;
  const paymentError = webhookError || apiPaymentError;

  useEffect(() => {
    if (returnStatus === 'success' && webhookState === 'idle') {
      requestAnimationFrame(() => { setWebhookState('success'); });
      toast.success('تم الدفع بنجاح!');
      const timer = setTimeout(() => {
        router.push('/dashboard/bookings');
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (returnStatus === 'failed' && webhookState === 'idle') {
      requestAnimationFrame(() => { setWebhookState('failed'); });
      toast.error('فشلت عملية الدفع');
    }
  }, [returnStatus, returnPaymentId, router, webhookState]);

  // Get payment methods
  const { data: paymentMethods, isLoading: methodsLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentsApi.getMethods().then((res) => res.data),
    enabled: isAuthenticated,
  });

  // Get booking details if booking_id is provided
  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(String(bookingId!)).then((res) => res.data),
    enabled: !!bookingId && isAuthenticated,
  });

  const totalAmount = booking?.total_price || 0;

  // ── Chargily Redirect Flow ──
  const handleCardPayment = useCallback(async () => {
    if (!bookingId) {
      toast.error('لا يوجد حجز للدفع');
      return;
    }

    setIsRedirecting(true);
    setApiPaymentError(null);

    try {
      const result = await paymentsApi.chargilyCheckout({
        booking_id: bookingId,
        amount: totalAmount,
      });

      if (result.status === 'sovereign_halt') {
        const msg = result.message_en || 'فشل إنشاء عملية الدفع';
        toast.error(msg);
        setApiPaymentError(msg);
        setIsRedirecting(false);
      } else if (result.data?.checkout_url) {
        // Redirect to Chargily hosted checkout (PCI-DSS compliant)
        window.location.href = result.data.checkout_url;
      } else {
        toast.error('فشل إنشاء عملية الدفع');
        setApiPaymentError('فشل إنشاء عملية الدفع');
        setIsRedirecting(false);
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم');
      setApiPaymentError('خطأ في الاتصال بالخادم');
      setIsRedirecting(false);
    }
  }, [bookingId, totalAmount]);

  if (!isAuthenticated) {
    return null;
  }

  if (methodsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // ── Payment Success Screen ──
  if (paymentCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ParticleField />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10"
        >
          <div className="mb-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">تم الدفع بنجاح!</h2>
            <p className="text-muted-foreground">سيتم تحويلك إلى صفحة الحجوزات...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ParticleField />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <Link href="/cart" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          العودة إلى السلة
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-sovereign-gold via-yellow-400 to-sovereign-gold bg-clip-text text-transparent inline-block leading-tight py-2">
            إتمام الدفع
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Wilaya Selection */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    عنوان التوصيل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {WILAYAS.map((wilaya) => (
                        <SelectItem key={wilaya.id} value={String(wilaya.id)}>
                          {wilaya.id} - {wilaya.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Selection */}
            {!selectedMethod && (
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>اختر طريقة الدفع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {paymentMethods?.filter((m: Record<string, unknown>) => m.available !== false).map((method: Record<string, unknown>) => (
                        <Button
                          key={method.type}
                          variant="outline"
                          className="h-auto p-4 justify-start"
                          onClick={() => setSelectedMethod(method.type as string)}
                        >
                          <div className="flex items-center gap-4 w-full">
                            {(method.type as string) === 'baridimob' ? (
                              <Smartphone className="h-6 w-6" />
                            ) : (
                              <CreditCard className="h-6 w-6" />
                            )}
                            <div className="flex-1 text-right">
                              <div className="font-semibold">{(method.display_name as string) || (method.name as string)}</div>
                              <div className="text-sm text-muted-foreground">
                                {(method.type as string) === 'card' ? 'CIB / Edahabia عبر Chargily' : (method.description as string)}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking && (
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الحجز</p>
                    <p className="font-semibold">#{booking.id}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold">{formatNumber(totalAmount)} دج</p>
                </div>
                {selectedMethod && (
                  <Button
                    variant="outline"
                    onClick={() => { setSelectedMethod(null); setApiPaymentError(null); }}
                    className="w-full"
                  >
                    تغيير طريقة الدفع
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Form Area */}
            {selectedMethod === 'baridimob' && (
              <Card>
                <CardContent className="p-6 text-center space-y-4">
                  <Smartphone className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    الدفع عبر باريديموب — قريبًا
                  </p>
                  <Button disabled className="w-full">
                    باريديموب — قريبًا
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'card' && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold">الدفع الآمن عبر Chargily Pay</p>
                      <p className="text-xs text-muted-foreground">CIB و Edahabia — لا نلمس بيانات بطاقتك</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    سيتم توجيهك لبوابة الدفع الآمنة لإدخال بيانات بطاقتك.
                    بياناتك محمية بتشفير SSL وتوافق PCI-DSS.
                  </p>

                  {paymentError && (
                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{paymentError}</p>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleCardPayment}
                    disabled={isRedirecting || !bookingId}
                  >
                    {isRedirecting ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري التحويل...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 ml-2" />
                        الدفع ببطاقة بنكية (CIB/Edahabia)
                        <ExternalLink className="h-4 w-4 mr-2" />
                      </>
                    )}
                  </Button>

                  {!bookingId && (
                    <p className="text-xs text-destructive text-center">
                      لا يوجد حجز مرتبط. يرجى إتمام الحجز أولاً من السلة.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
