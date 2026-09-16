'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, Smartphone, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Checkout Page — Creates Chargily checkout session + redirects to pay
// This closes the PAYMENT loop: Booking → Chargily → Escrow Hold
// ═══════════════════════════════════════════════════════════════

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [deposit, setDeposit] = useState<Record<string, unknown> | null>(null);

  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?callback=/checkout');
      return;
    }
    if (!bookingId) {
      toast.error('معرف الحجز مفقود');
      router.push('/dashboard');
      return;
    }
    loadBookingAndDeposit();
  }, [isAuthenticated, bookingId, router]);

  const loadBookingAndDeposit = async () => {
    try {
      // Fetch booking details
      const bookingRes = await api.get(`/bookings/${bookingId}/`);
      const bookingData = bookingRes.data?.data || bookingRes.data;
      setBooking(bookingData);

      // Fetch deposit calculation
      if (bookingData?.start_date && bookingData?.end_date) {
        const depositRes = await api.get(
          `/bookings/calculate-deposit?product_id=${bookingData.product_id}&start_date=${bookingData.start_date}&end_date=${bookingData.end_date}&rental_unit=${bookingData.rental_unit || 'DAY'}`
        );
        setDeposit(depositRes.data?.data || depositRes.data);
      }
    } catch {
      toast.error('فشل تحميل تفاصيل الحجز');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setRedirecting(true);
    try {
      // Create Chargily checkout session
      const res = await api.post('/payments/chargily/checkout/', {
        booking_id: bookingId,
      });

      if (res.data?.data?.checkout_url) {
        // Redirect to Chargily payment page
        window.location.href = res.data.data.checkout_url;
      } else if (res.data?.data?.redirect_url) {
        window.location.href = res.data.data.redirect_url;
      } else {
        toast.error('فشل إنشاء جلسة الدفع — تحقق من إعدادات Chargily');
        setRedirecting(false);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message_en?: string } } })?.response?.data?.message_en || 'فشل إنشاء الدفع';
      toast.error(msg);
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">الحجز غير موجود</p>
      </div>
    );
  }

  const totalCharged = (deposit?.total_charged as number) || (booking.total_price as number) || 0;
  const breakdown = deposit?.breakdown as Record<string, unknown> | undefined;
  const rentalFee = (breakdown?.rental_fee as number) || (booking.rental_fee as number) || (booking.total_price as number) || 0;
  const securityDeposit = (breakdown?.security_deposit as number) || (booking.deposit_amount as number) || 0;
  const depositMode = (breakdown?.deposit_mode as string) || 'RECOMMENDED';
  const insuranceFee = (breakdown?.insurance_fee as number) || 0;
  const rentalUnit = (deposit?.rental_unit as string) || (booking.rental_unit as string) || 'DAY';
  const duration = (deposit?.duration as number) || (booking.duration as number) || 1;
  const smartRec = deposit?.smart_recommendation as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">الدفع الآمن</h1>
            <p className="text-muted-foreground mt-1">جميع المبالغ تُحتجز في حساب ضمان سيادي آمن</p>
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-black text-lg">
                  {(booking.product_name as string)?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="font-bold">{booking.product_name || 'منتج'}</h2>
                  <p className="text-xs text-muted-foreground">
                    {duration} {rentalUnit === 'HOUR' ? 'ساعة' : rentalUnit === 'MONTH' ? 'شهر' : 'يوم'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">رقم الحجز</p>
                <p className="font-mono text-xs font-bold">{(bookingId || '').slice(-8)}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  رسوم الكراء ({duration} {rentalUnit === 'HOUR' ? 'ساعة' : rentalUnit === 'MONTH' ? 'شهر' : 'يوم'})
                </span>
                <span className="font-bold">{formatNumber(rentalFee)} دج</span>
              </div>

              {securityDeposit > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    ضمان الأمان ({depositMode === 'FIXED' ? 'مبلغ ثابت' : depositMode === 'NONE' ? 'لا شيء' : (breakdown?.security_deposit_percentage as string) + '%'})
                    <span className="text-emerald-600 text-xs ml-1">يُعاد عند الاستلام</span>
                  </span>
                  <span className="font-bold text-emerald-600">{formatNumber(securityDeposit)} دج</span>
                </div>
              )}

              {insuranceFee > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">تأمين</span>
                  <span className="font-bold">{formatNumber(insuranceFee)} دج</span>
                </div>
              )}

              <div className="h-px bg-gray-200 w-full" />

              <div className="flex justify-between items-center pt-1">
                <span className="text-lg font-bold">المجموع المطلوب دفعه</span>
                <span className="text-3xl font-black text-blue-600">{formatNumber(totalCharged)} دج</span>
              </div>
            </div>

            {/* Smart Recommendation Banner */}
            {smartRec && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700">
                  <span className="font-bold">وضع الضمان: {depositMode}</span>
                  {smartRec.conversion_lift && (
                    <span className="ml-2 text-emerald-600 font-bold">↑ يرفع نسبة الحجز بـ {smartRec.conversion_lift as string}</span>
                  )}
                </div>
              </div>
            )}

            {/* Escrow Protection Badge */}
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700">
                جميع المبلغ يُحتجز في حساب ضمان آمن. لا يُحوَّل للبائع قبل تأكيدك استلام المنتج بحالة جيدة.
              </p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-bold mb-4 text-sm">طرق الدفع المتاحة</h3>
            <div className="space-y-3">
              {/* Chargily Pay */}
              <button
                onClick={handlePay}
                disabled={redirecting}
                className="w-full p-4 rounded-2xl border-2 border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">بطاقة CIB / الذهبية</p>
                    <p className="text-xs text-muted-foreground">عبر بوابة Chargily Pay الآمنة</p>
                  </div>
                </div>
                {redirecting ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <div className="text-left">
                    <p className="font-black text-lg text-blue-600">{formatNumber(totalCharged)}</p>
                    <p className="text-xs text-muted-foreground">دج</p>
                  </div>
                )}
              </button>

              {/* BaridiMob (future) */}
              <div className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center justify-between opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-300 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">BaridiMob</p>
                    <p className="text-xs text-muted-foreground">قريباً</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>🔒 جميع المعاملات مشفّرة بـ SSL/TLS</p>
            <p>✓ بوابة دفع مرخّصة من البنك المركزي الجزائري</p>
            <p>💰 لا رسوم خفية — المبلغ المعروض هو المبلغ المحتجز</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
