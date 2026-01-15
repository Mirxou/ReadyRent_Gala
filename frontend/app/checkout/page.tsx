'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BaridiMobForm } from '@/components/payment/baridimob-form';
import { BankCardForm } from '@/components/payment/bank-card-form';
import { paymentsApi, bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { ParticleField } from '@/components/ui/particle-field';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  
  const bookingId = searchParams.get('booking_id') ? parseInt(searchParams.get('booking_id')!) : null;
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  // Get payment methods
  const { data: paymentMethods, isLoading: methodsLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentsApi.getMethods().then((res) => res.data),
    enabled: isAuthenticated,
  });

  // Get booking details if booking_id is provided
  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId!).then((res) => res.data),
    enabled: !!bookingId && isAuthenticated,
  });

  const totalAmount = booking?.total_price || 0;

  const handlePaymentCompleted = () => {
    setPaymentCompleted(true);
    queryClient.invalidateQueries({ queryKey: ['bookings', 'cart'] });
    
    // Redirect to bookings page after 2 seconds
    setTimeout(() => {
      router.push('/dashboard/bookings');
    }, 2000);
  };

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
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center" style={{
            background: 'linear-gradient(to right, rgb(139, 92, 246), rgb(236, 72, 153), rgb(245, 158, 11))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
            lineHeight: '1.2',
            padding: '0.5rem 0',
          }}>
            إتمام الدفع
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment Methods Selection */}
            {!selectedMethod && (
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>اختر طريقة الدفع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {paymentMethods?.map((method: any) => (
                        <Button
                          key={method.id}
                          variant="outline"
                          className="h-auto p-4 justify-start"
                          onClick={() => setSelectedMethod(method.name)}
                        >
                          <div className="flex items-center gap-4 w-full">
                            {method.name === 'baridimob' ? (
                              <Smartphone className="h-6 w-6" />
                            ) : (
                              <CreditCard className="h-6 w-6" />
                            )}
                            <div className="flex-1 text-right">
                              <div className="font-semibold">{method.display_name}</div>
                              {method.description && (
                                <div className="text-sm text-muted-foreground">{method.description}</div>
                              )}
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
                  <p className="text-2xl font-bold">{totalAmount.toLocaleString()} DZD</p>
                </div>
                {selectedMethod && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMethod(null)}
                    className="w-full"
                  >
                    تغيير طريقة الدفع
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            {selectedMethod && (
              <div>
                {selectedMethod === 'baridimob' ? (
                  <BaridiMobForm
                    amount={totalAmount}
                    bookingId={bookingId || undefined}
                    onPaymentCompleted={handlePaymentCompleted}
                  />
                ) : selectedMethod === 'bank_card' ? (
                  <BankCardForm
                    amount={totalAmount}
                    bookingId={bookingId || undefined}
                    onPaymentCompleted={handlePaymentCompleted}
                  />
                ) : null}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
