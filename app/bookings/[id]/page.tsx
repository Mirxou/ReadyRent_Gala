'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

import {
  ShieldCheck,
  Calendar,
  ChevronLeft,
  Lock,
  ArrowUpRight,
  XCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignSeal } from '@/shared/components/sovereign/sovereign-seal';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { EscrowTracker } from '@/features/finance/components/escrow-tracker';
import { ContractTimeline } from '@/components/contract/contract-timeline';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// ═══════════════════════════════════════════════════════════════
// Types — matching the actual API response (snake_case, String IDs)
// ═══════════════════════════════════════════════════════════════
interface BookingDetail {
  id: string;
  user_id: string | null;
  product_id: string | null;
  product_name: string | null;
  product_image: string | null;
  start_date: string | null;
  end_date: string | null;
  total_price: number;
  status: string;
  escrow_status: string;
  has_insurance: boolean;
  extra_services: unknown[];
  quantity: number;
  size: string | null;
  color: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product: {
    id: string;
    name: string;
    name_ar?: string;
    primary_image?: string;
    slug?: string;
    vendor_id?: string | null;
  } | null;
  items?: {
    id: string;
    product_id: string;
    price_per_day: number;
  }[];
  contracts?: {
    id: string;
    status: string;
    contract_hash: string | null;
    signed_at: string | null;
    created_at: string;
  }[];
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/bookings/${id}`);
      return;
    }
    if (!id) return;
    fetch(`/api/bookings/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setBooking(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, isAuthenticated, router]);

  const isOwner = booking?.user_id === user?.id;
  const canConfirmReceipt =
    isOwner &&
    booking &&
    (booking.status === 'confirmed' || booking.status === 'active') &&
    booking.escrow_status === 'held';

  const handleReleaseEscrow = async () => {
    if (!id || releasing) return;
    setReleasing(true);
    try {
      const res = await fetch(`/api/bookings/${id}/release-escrow`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setBooking((prev) =>
          prev
            ? { ...prev, status: 'completed', escrow_status: 'released' }
            : prev
        );
      }
    } catch {
      // silent
    } finally {
      setReleasing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-sovereign-obsidian">
        <div className="w-16 h-16 border-4 border-sovereign-gold/20 border-t-sovereign-gold rounded-full animate-spin" />
      </div>
    );

  if (!booking)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sovereign-obsidian p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500/50 mb-4" />
        <h1 className="text-2xl font-black italic text-white">الحجز غير موجود</h1>
        <p className="text-white/40 mt-2">
          لا يمكن العثور على بروتوكول الحجز المطلوب في السجل.
        </p>
      </div>
    );

  const statusColorMap: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const statusLabelMap: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    active: 'نشط',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };

  const pricePerDay = booking.items?.[0]?.price_per_day;

  const contractData = booking.contracts?.[0] || null;
  const timelineContract = contractData
    ? {
        id: contractData.id,
        booking_id: booking.id,
        status:
          booking.status === 'cancelled'
            ? ('void' as const)
            : contractData.status === 'finalized'
              ? ('finalized' as const)
              : ('signed' as const),
        is_finalized: contractData.status === 'finalized' || false,
        contract_hash: contractData.contract_hash || '',
        renter_signature: contractData.signed_at ? 'signed' : undefined,
        signed_at: contractData.signed_at ?? undefined,
        snapshot: {
          escrow_status: booking.escrow_status,
          escrow_locked: booking.escrow_status === 'held',
          active_since:
            booking.status === 'active' ? booking.start_date : undefined,
          completed_at:
            booking.status === 'completed' ? booking.end_date : undefined,
        },
        created_at: contractData.created_at,
      }
    : null;

  return (
    <div
      className="min-h-screen bg-sovereign-obsidian text-sovereign-white font-arabic p-6 md:p-12 lg:p-20 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* 🏗️ Navigation & Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-white/40 hover:text-sovereign-gold transition-colors text-xs font-black uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" /> عودة للسجل
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-black italic tracking-tighter">
                بروتوكول <span className="text-sovereign-gold">الحجز.</span>
              </h1>
              <Badge
                className={
                  statusColorMap[booking.status] ||
                  'bg-white/5 border-white/10 text-white/40 px-3 py-1 text-[10px] tracking-widest'
                }
              >
                {statusLabelMap[booking.status] || booking.status}
              </Badge>
              <Badge className="bg-white/5 border-white/10 text-white/40 px-3 py-1 font-mono text-[10px] tracking-widest">
                ID #{booking.id.slice(0, 8).toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg font-light italic">
              سيادة التعاقد:{' '}
              {booking.product?.name_ar ||
                booking.product?.name ||
                booking.product_name ||
                'منتج'}
            </p>
            <div className="flex flex-wrap gap-3">
              {(booking.status === 'pending' ||
                booking.status === 'confirmed') && (
                <Link
                  href={`/bookings/${id}/cancel`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> إلغاء الحجز
                </Link>
              )}
              {(booking.status === 'active' ||
                booking.status === 'completed') && (
                <Link
                  href={`/disputes/new?booking_id=${id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" /> فتح نزاع
                </Link>
              )}
              {canConfirmReceipt && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                      disabled={releasing}
                    >
                      {releasing ? (
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {releasing ? 'جاري التأكيد...' : 'تأكيد الاستلام'}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-sovereign-obsidian border-white/10 text-white" dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-right">
                        تأكيد استلام المنتج
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-right text-white/60">
                        بضغطك على &quot;تأكيد&quot; فإنك:
                        <br />• تُوقّع وصل الاستلام رقمياً (القانون 18-05 مادة 17)
                        <br />• تُحرر المبلغ المحتجز للمؤجر
                        <br />• يُعتبر العقد مُنهياً ولا يُقبل النزاع بعد التأكيد
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-3">
                      <AlertDialogAction
                        onClick={handleReleaseEscrow}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        تأكيد الاستلام
                      </AlertDialogAction>
                      <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60">
                        إلغاء
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-white/30 block mb-1">
                المبلغ الإجمالي
              </span>
              <span className="text-4xl font-black text-white italic">
                {formatNumber(booking.total_price)}{' '}
                <small className="text-xs text-sovereign-gold uppercase not-italic">
                  DA
                </small>
              </span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <SovereignSeal type="contract" refId={`BK-${booking.id}`} size="sm" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📊 main content */}
          <div className="lg:col-span-2 space-y-8">
            <GlassPanel className="p-10 space-y-10 rounded-[3rem]" gradientBorder>
              <div className="flex flex-col md:flex-row justify-between gap-12">
                <div className="space-y-8 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sovereign-gold/10 rounded-xl flex items-center justify-center text-sovereign-gold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black italic">الفترة الزمنية</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase text-white/20 tracking-widest">
                        تاريخ الاستلام
                      </span>
                      <p className="text-xl font-bold italic">
                        {booking.start_date
                          ? new Date(booking.start_date).toLocaleDateString('ar-DZ')
                          : '—'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase text-white/20 tracking-widest">
                        تاريخ الإرجاع
                      </span>
                      <p className="text-xl font-bold italic">
                        {booking.end_date
                          ? new Date(booking.end_date).toLocaleDateString('ar-DZ')
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-px bg-white/5 hidden md:block" />

                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    {(booking.product_image ||
                      booking.product?.primary_image) && (
                      <div className="relative w-20 h-20 rounded-2xl border border-white/10 overflow-hidden flex-shrink-0">
                        <img
                          src={
                            booking.product_image ||
                            booking.product?.primary_image ||
                            '/placeholder.svg'
                          }
                          alt={
                            booking.product?.name_ar ||
                            booking.product?.name ||
                            'منتج'
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-sovereign-gold">
                        التفاصيل الفنية
                      </span>
                      <h3 className="text-xl font-black italic">
                        {booking.product?.name_ar ||
                          booking.product?.name ||
                          booking.product_name ||
                          'منتج'}
                      </h3>
                      <p className="text-xs text-white/40">
                        {pricePerDay
                          ? `${formatNumber(pricePerDay)} DA / يوم`
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <SovereignButton variant="secondary" size="sm" className="w-full">
                    عرض بروتوكول الأصل{' '}
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </SovereignButton>
                </div>
              </div>
            </GlassPanel>

            {/* 2. Contract Timeline */}
            {timelineContract && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-4">
                    مسار <span className="text-sovereign-gold">العقد.</span>
                  </h2>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] uppercase font-black tracking-widest">
                    التسجيل الثابت نشط
                  </Badge>
                </div>
                <ContractTimeline contract={timelineContract} />
              </div>
            )}
          </div>

          {/* 🔒 Sidebar: Financial Vault & Status */}
          <div className="space-y-8">
            <h2 className="text-3xl font-black italic tracking-tighter border-b border-white/5 pb-4">
              خزنة <span className="text-sovereign-gold">السيادة.</span>
            </h2>

            <EscrowTracker
              bookingId={booking.id}
              amount={booking.total_price}
              status={booking.escrow_status}
              canRelease={canConfirmReceipt ?? false}
              onRelease={handleReleaseEscrow}
              releasing={releasing}
            />

            {/* Legal compliance notice */}
            <div className="p-6 bg-sovereign-gold/5 border border-sovereign-gold/10 rounded-[2rem] flex items-start gap-4">
              <ShieldCheck className="w-7 h-7 text-sovereign-gold/60 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-black italic tracking-tight text-sm">
                  حماية قانونية
                </h4>
                <p className="text-xs text-white/40 leading-relaxed">
                  {booking.escrow_status === 'held'
                    ? 'المبلغ محتجز بأمان. عند تأكيد الاستلام يتحرر للمؤجر (مادة 17 قانون 18-05).'
                    : booking.escrow_status === 'released'
                      ? 'تم تحرير المبلغ للمؤجر. التحويل البنكي خلال 48 ساعة.'
                      : booking.escrow_status === 'refunded'
                        ? 'تم استرداد المبلغ. التحويل خلال 15 يوم كحد أقصى (مادة 22 قانون 18-05).'
                        : 'لم يتم الدفع بعد.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-20 pb-10 border-t border-white/5 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-4 opacity-20">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-white" />
            <Lock className="w-4 h-4" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-white" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
              STANDARD.Rent | نظام STANDARD.Rent 2026
            </p>
            <p className="text-[9px] text-white/10 uppercase tracking-widest">
              الحقيقة الراديكالية • الأمان المطلق • كود تحفة فنية
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
