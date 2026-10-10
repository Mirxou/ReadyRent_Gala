'use client';

// ═══════════════════════════════════════════════════════════════
// GRAFT PHASE 3 — Admin Payout Queue (كراء بلا همّ)
// The human leg of the 360° money path: verify vendor identity,
// transfer via CCP/BaridiMob/RIB, record the reference, close the loop.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Loader2,
  Check,
  X,
  Send,
  ArrowRight,
  Hourglass,
} from 'lucide-react';
import { toast } from 'sonner';

import { payoutsApi, type PayoutRequestDTO } from '@/lib/api/payouts';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'قيد المراجعة', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'تمت الموافقة', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  paid: { label: 'تم التحويل', className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'مرفوض', className: 'bg-red-100 text-red-800 border-red-200' },
};

function formatDZD(amount: number): string {
  return `${new Intl.NumberFormat('fr-DZ').format(amount)} دج`;
}

type DialogState =
  | { kind: 'none' }
  | { kind: 'approve'; request: PayoutRequestDTO }
  | { kind: 'reject'; request: PayoutRequestDTO }
  | { kind: 'mark_paid'; request: PayoutRequestDTO };

export default function AdminPayoutsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  const [note, setNote] = useState('');
  const [transferRef, setTransferRef] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', statusFilter],
    queryFn: () => payoutsApi.adminList({ status: statusFilter || undefined }),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
  });

  const actionMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      action: 'approve' | 'reject' | 'mark_paid';
      note?: string;
      transfer_ref?: string;
    }) => payoutsApi.adminAction(payload.id, {
      action: payload.action,
      note: payload.note,
      transfer_ref: payload.transfer_ref,
    }),
    onSuccess: (res, payload) => {
      if ((res as { code?: string })?.code === 'CONCURRENT_MODIFICATION') {
        toast.error('تم تغيير حالة الطلب للتو بواسطة عملية أخرى');
      } else if ((res as { code?: string })?.code) {
        toast.error(res?.message_ar || 'تعذر تنفيذ الإجراء');
      } else {
        toast.success('تم تنفيذ الإجراء بنجاح');
      }
      setDialog({ kind: 'none' });
      setNote('');
      setTransferRef('');
      void payload;
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
    },
    onError: () => toast.error('تعذر تنفيذ الإجراء — حاول مجدداً'),
  });

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null;
  }

  const requests = data?.data?.requests ?? [];
  const pendingCount = data?.data?.pending_count ?? 0;
  const pendingAmount = data?.data?.pending_amount ?? 0;

  const openDialog = (kind: 'approve' | 'reject' | 'mark_paid', request: PayoutRequestDTO) => {
    setNote('');
    setTransferRef('');
    setDialog({ kind, request });
  };

  const submitDialog = () => {
    if (dialog.kind === 'none') return;
    if (dialog.kind === 'reject' && note.trim().length < 3) {
      toast.error('سبب الرفض مطلوب');
      return;
    }
    if (dialog.kind === 'mark_paid' && transferRef.trim().length < 3) {
      toast.error('مرجع الحوالة مطلوب لتوثيق الدفع');
      return;
    }
    actionMutation.mutate({
      id: dialog.request.id,
      action: dialog.kind,
      note: note.trim() || undefined,
      transfer_ref: transferRef.trim() || undefined,
    });
  };

  const filters = [
    { value: '', label: 'الكل' },
    { value: 'pending', label: 'قيد المراجعة' },
    { value: 'approved', label: 'تمت الموافقة' },
    { value: 'paid', label: 'تم التحويل' },
    { value: 'rejected', label: 'مرفوض' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Banknote className="w-7 h-7" />
            طلبات سحب الأرباح
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            معالجة طلبات التجار — تحويل يدوي عبر CCP / باريدي موب / RIB.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          لوحة الإدارة
        </Button>
      </div>

      {/* ── Pending summary ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                طلبات بانتظار المعالجة
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums">{pendingCount}</p>
            </div>
            <Hourglass className="w-8 h-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              إجمالي المبالغ المنتظرة
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums">{formatDZD(pendingAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Queue ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-xl">قائمة المعالجة</CardTitle>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              لا توجد طلبات في هذه الحالة.
            </p>
          ) : (
            <div className="max-h-[600px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>التاجر</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>الحساب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => {
                    const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES.pending;
                    const actionable = r.status === 'pending' || r.status === 'approved';
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-bold text-sm">
                            {r.vendor?.name_ar || r.vendor?.name || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.user?.email ?? '—'}
                          </p>
                        </TableCell>
                        <TableCell className="font-bold tabular-nums">
                          {formatDZD(r.amount)}
                        </TableCell>
                        <TableCell className="text-sm">{r.method_label ?? r.method}</TableCell>
                        <TableCell>
                          <p className="text-sm font-mono" dir="ltr">{r.account_number}</p>
                          <p className="text-xs text-muted-foreground">{r.account_name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.className}>
                            {badge.label}
                          </Badge>
                          {r.status === 'paid' && r.transfer_ref ? (
                            <p className="text-xs text-muted-foreground mt-1" dir="ltr">
                              ref: {r.transfer_ref}
                            </p>
                          ) : null}
                          {r.status === 'rejected' && r.admin_note ? (
                            <p className="text-xs text-red-700 mt-1">{r.admin_note}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-left">
                          {actionable ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => openDialog('approve', r)}
                                title="الموافقة"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-700 border-green-200 hover:bg-green-50"
                                onClick={() => openDialog('mark_paid', r)}
                                title="تسجيل التحويل"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-700 border-red-200 hover:bg-red-50"
                                onClick={() => openDialog('reject', r)}
                                title="رفض"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">مكتمل</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Action dialog ── */}
      <Dialog
        open={dialog.kind !== 'none'}
        onOpenChange={(open) => {
          if (!open) setDialog({ kind: 'none' });
        }}
      >
        <DialogContent className="sm:max-w-md">
          {dialog.kind !== 'none' && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog.kind === 'approve' && 'الموافقة على طلب السحب'}
                  {dialog.kind === 'mark_paid' && 'تسجيل تحويل الأرباح'}
                  {dialog.kind === 'reject' && 'رفض طلب السحب'}
                </DialogTitle>
                <DialogDescription>
                  {formatDZD(dialog.request.amount)} —{' '}
                  {dialog.request.vendor?.name_ar || dialog.request.vendor?.name || ''} —{' '}
                  {dialog.request.method_label ?? dialog.request.method}{' '}
                  <span dir="ltr" className="font-mono">
                    ({dialog.request.account_number})
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {dialog.kind === 'mark_paid' && (
                  <div className="space-y-2">
                    <Label htmlFor="transfer-ref">مرجع الحوالة *</Label>
                    <Input
                      id="transfer-ref"
                      placeholder="رقم وصل التحويل البريدي/البنكي"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                    />
                  </div>
                )}
                {(dialog.kind === 'reject' || dialog.kind === 'approve') && (
                  <div className="space-y-2">
                    <Label htmlFor="payout-note">
                      {dialog.kind === 'reject' ? 'سبب الرفض *' : 'ملاحظة (اختياري)'}
                    </Label>
                    <Textarea
                      id="payout-note"
                      placeholder={
                        dialog.kind === 'reject'
                          ? 'مثال: بيانات الحساب غير مطابقة لاسم التاجر'
                          : 'ملاحظة داخلية أو إشعار للتاجر'
                      }
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
                {dialog.kind === 'approve' && (
                  <p className="text-sm text-muted-foreground">
                    سيصلك تأكيد على البريد الإلكتروني للتاجر، ثم سجّل التحويل لاحقاً بزر
                    «تسجيل التحويل» مع مرجع الوصل.
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDialog({ kind: 'none' })}>
                  إلغاء
                </Button>
                <Button
                  onClick={submitDialog}
                  disabled={actionMutation.isPending}
                  className={
                    dialog.kind === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : dialog.kind === 'mark_paid'
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                  }
                >
                  {actionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  {dialog.kind === 'approve' && 'تأكيد الموافقة'}
                  {dialog.kind === 'mark_paid' && 'تأكيد التحويل'}
                  {dialog.kind === 'reject' && 'تأكيد الرفض'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
