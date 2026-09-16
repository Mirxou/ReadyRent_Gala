'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Package, Clock, CheckCircle2, AlertTriangle, DollarSign,
  Shield, ArrowRightLeft, Eye, Calendar, TrendingUp, RotateCcw
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Vendor Order Management — track bookings, process returns,
// monitor overdue, approve escrow deductions.
// ═══════════════════════════════════════════════════════════════

interface Booking {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string | null;
  product_image: string | null;
  start_date: string;
  end_date: string;
  rental_unit?: string;
  duration?: number;
  total_price: number;
  rental_fee?: number;
  deposit_amount?: number;
  status: string;
  escrow_status: string;
  has_insurance: boolean;
  quantity: number;
  is_custom_offer?: boolean;
  custom_offer_note?: string | null;
  late_fee_charged?: number;
  deduction_amount?: number;
  actual_return_date?: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: 'بانتظار الدفع',  color: 'bg-amber-500/10 text-amber-600',       icon: Clock },
  confirmed: { label: 'مؤكد',           color: 'bg-blue-500/10 text-blue-600',         icon: CheckCircle2 },
  active:    { label: 'نشط',             color: 'bg-emerald-500/10 text-emerald-600',   icon: Package },
  overdue:   { label: 'متأخر!',          color: 'bg-red-500/10 text-red-600',           icon: AlertTriangle },
  completed: { label: 'مكتمل',           color: 'bg-gray-500/10 text-gray-600',          icon: CheckCircle2 },
  cancelled: { label: 'ملغى',            color: 'bg-gray-500/10 text-gray-400',         icon: AlertTriangle },
};

const ESCROW_CONFIG: Record<string, { label: string; color: string }> = {
  none:          { label: 'لا ضمان',      color: 'bg-gray-500/10 text-gray-500' },
  held:          { label: 'محتجز',         color: 'bg-amber-500/10 text-amber-600' },
  released:      { label: 'مُحرَّر',        color: 'bg-emerald-500/10 text-emerald-600' },
  refunded:     { label: 'مُسترد',         color: 'bg-blue-500/10 text-blue-600' },
  partial_refund:{ label: 'خصم جزئي',      color: 'bg-purple-500/10 text-purple-600' },
};

export default function VendorOrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings/?limit=50');
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setBookings(data);
    } catch {
      toast.error('فشل تحميل الحجوزات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadBookings();
    else setLoading(false);
  }, [isAuthenticated, loadBookings]);

  // Filter bookings by status
  const filtered = filter === 'all'
    ? bookings
    : filter === 'overdue'
    ? bookings.filter(b => b.status === 'overdue' || (b.status === 'active' && new Date(b.end_date) < new Date()))
    : bookings.filter(b => b.status === filter);

  // Stats
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    overdue: bookings.filter(b => b.status === 'overdue').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed' || b.status === 'active')
      .reduce((sum, b) => sum + (b.rental_fee || b.total_price || 0), 0),
    totalEscrow: bookings
      .filter(b => b.escrow_status === 'held')
      .reduce((sum, b) => sum + (b.deposit_amount || 0), 0),
    totalLateFees: bookings
      .reduce((sum, b) => sum + (b.late_fee_charged || 0), 0),
  };

  // Process return
  const handleProcessReturn = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      const res = await api.post(`/bookings/${bookingId}/return/`);
      if (res.data?.success) {
        toast.success(`تم تأكيد الإرجاع — ${res.data?.data?.late_fee_charged > 0 ? `رسوم تأخير: ${res.data.data.late_fee_charged} دج` : 'في الوقت المحدد ✓'}`);
        loadBookings();
      } else {
        toast.error(res.data?.message_en || 'فشل معالجة الإرجاع');
      }
    } catch (e: unknown) {
      toast.error('فشل معالجة الإرجاع — تحقق من حالة الحجز');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-muted-foreground">يرجى تسجيل الدخول للوصول إلى إدارة الطلبات</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">إدارة الحجوزات</h1>
        <p className="text-muted-foreground mt-1">تتبع الحجوزات، معالجة الإرجاع، مراقبة التأخيرات والضمان</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        <Card>
          <CardContent className="p-3 text-center">
            <Package className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xl font-black">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-xl font-black">{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground">بانتظار</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-xl font-black">{stats.active}</p>
            <p className="text-[10px] text-muted-foreground">نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto text-red-500 mb-1" />
            <p className="text-xl font-black text-red-600">{stats.overdue}</p>
            <p className="text-[10px] text-muted-foreground">متأخر</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-black">{formatNumber(stats.totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">دج إيرادات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Shield className="w-5 h-5 mx-auto text-amber-600 mb-1" />
            <p className="text-lg font-black">{formatNumber(stats.totalEscrow)}</p>
            <p className="text-[10px] text-muted-foreground">دج محتجز</p>
          </CardContent>
        </Card>
      </div>

      {/* Late Fees Alert */}
      {stats.totalLateFees > 0 && (
        <div className="mb-6 p-4 bg-red-500/5 rounded-xl border border-red-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600 font-bold">
            رسوم تأخير متراكمة: {formatNumber(stats.totalLateFees)} دج — من {stats.overdue} حجز متأخر
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'all', label: 'الكل', count: stats.total },
          { key: 'pending', label: 'بانتظار', count: stats.pending },
          { key: 'active', label: 'نشط', count: stats.active },
          { key: 'overdue', label: 'متأخر', count: stats.overdue },
          { key: 'completed', label: 'مكتمل', count: stats.completed },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/30 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد حجوزات في هذه الفئة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const statusConf = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
            const escrowConf = ESCROW_CONFIG[b.escrow_status] || ESCROW_CONFIG.none;
            const isOverdue = b.status === 'overdue' || (b.status === 'active' && new Date(b.end_date) < new Date());
            const canProcessReturn = b.status === 'active' || b.status === 'overdue';

            return (
              <Card key={b.id} className={isOverdue ? 'ring-2 ring-red-500/30' : ''}>
                <CardContent className="p-5">
                  {/* Row 1: Product + Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-black">
                        {(b.product_name || '?').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">{b.product_name || 'منتج'}</h3>
                        <p className="text-xs text-muted-foreground">
                          {b.rental_unit === 'HOUR' ? `${b.duration || 1} ساعة` : b.rental_unit === 'MONTH' ? `${b.duration || 1} شهر` : `${b.duration || 1} يوم`}
                          {b.quantity > 1 && ` × ${b.quantity}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusConf.color}>
                        <statusConf.icon className="w-3 h-3 ml-1" />
                        {statusConf.label}
                      </Badge>
                      {b.is_custom_offer && (
                        <Badge className="bg-purple-500/10 text-purple-600">عرض خاص</Badge>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Financial Details */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <p className="text-[9px] text-muted-foreground uppercase">رسوم الكراء</p>
                      <p className="font-bold text-sm">{formatNumber(b.rental_fee || b.total_price)} دج</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <p className="text-[9px] text-muted-foreground uppercase">الضمان</p>
                      <p className="font-bold text-sm">{formatNumber(b.deposit_amount || 0)} دج</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <p className="text-[9px] text-muted-foreground uppercase">حالة الضمان</p>
                      <Badge className={escrowConf.color + ' text-[10px]'}>{escrowConf.label}</Badge>
                    </div>
                    {b.late_fee_charged > 0 && (
                      <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                        <p className="text-[9px] text-red-600 uppercase">رسوم تأخير</p>
                        <p className="font-bold text-sm text-red-600">{formatNumber(b.late_fee_charged)} دج</p>
                      </div>
                    )}
                    {b.deduction_amount > 0 && (
                      <div className="p-2 bg-purple-500/5 rounded-lg border border-purple-500/10">
                        <p className="text-[9px] text-purple-600 uppercase">خصم تعويض</p>
                        <p className="font-bold text-sm text-purple-600">{formatNumber(b.deduction_amount)} دج</p>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>من: {new Date(b.start_date).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>إلى: {new Date(b.end_date).toLocaleDateString('ar-EG')}</span>
                    </div>
                    {b.actual_return_date && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <RotateCcw className="w-3 h-3" />
                        <span>أُرجع: {new Date(b.actual_return_date).toLocaleDateString('ar-EG')}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Actions */}
                  {canProcessReturn && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleProcessReturn(b.id)}
                        disabled={processingId === b.id}
                        className="gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {processingId === b.id ? 'جارٍ المعالجة...' : 'تأكيد الإرجاع'}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        تفاصيل
                      </Button>
                      {isOverdue && (
                        <Badge className="bg-red-500/10 text-red-600 ml-auto">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          متأخر — راجع رسوم التأخير
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Custom Offer Note */}
                  {b.is_custom_offer && b.custom_offer_note && (
                    <div className="mt-3 p-2 bg-purple-500/5 rounded-lg text-xs text-purple-600">
                      💡 {b.custom_offer_note}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
