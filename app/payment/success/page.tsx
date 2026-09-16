'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

// ═══════════════════════════════════════════════════════════════
// Payment Success — Chargily redirects here after successful payment
// The webhook has already processed the payment (escrow hold + contract).
// This page just shows the confirmation to the user.
// ═══════════════════════════════════════════════════════════════

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    if (bookingId) {
      // Poll for a few seconds — the webhook might take a moment to process
      const poll = async (attempt: number) => {
        try {
          const res = await api.get(`/bookings/${bookingId}/`);
          const data = res.data?.data || res.data;
          if (data?.status === 'confirmed' || attempt >= 5) {
            setBooking(data);
            setLoading(false);
          } else {
            setTimeout(() => poll(attempt + 1), 1000);
          }
        } catch {
          setLoading(false);
        }
      };
      poll(0);
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">جارٍ تأكيد الدفع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-emerald-500 mx-auto mb-6 flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-2xl font-black mb-2">تم الدفع بنجاح! 🎉</h1>
        <p className="text-muted-foreground text-sm mb-6">
          تم تأكيد دفعتك وحجز مبلغك في حساب الضمان السيادي الآمن.
        </p>

        {/* Booking Summary */}
        {booking && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-right">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-sm">{booking.product_name || 'منتج'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Calendar className="w-3 h-3" />
              <span>من: {new Date(booking.start_date as string).toLocaleDateString('ar-EG')}</span>
              <span>إلى: {new Date(booking.end_date as string).toLocaleDateString('ar-EG')}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">المبلغ المحتجز:</span>
              <span className="font-black text-lg text-blue-600">
                {Number(booking.total_price || 0).toLocaleString()} دج
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-3">
              <span className="text-xs bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full font-bold">
                ✓ الحجز مؤكد — الضمان محتجز
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="default"
            className="w-full"
            onClick={() => router.push('/dashboard/bookings')}
          >
            عرض حجوزاتي
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
