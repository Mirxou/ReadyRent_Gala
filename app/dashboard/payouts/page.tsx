'use client';

// ═══════════════════════════════════════════════════════════════
// GRAFT PHASE 3 — Vendor Payouts (كراء بلا همّ)
// أرباحي وسحبها — the merchant side of the money-out valve.
// Balance comes from the escrow engine (PayoutRecords); withdrawals
// are PayoutRequests processed by administration via CCP/BaridiMob/RIB.
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Wallet,
  Clock,
  CheckCircle2,
  Loader2,
  Landmark,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { payoutsApi, type PayoutRequestDTO } from '@/lib/api/payouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const METHOD_FIELDS: Record<string, { label: string; placeholder: string; hint: string }> = {
  ccp: {
    label: 'رقم الحساب البريدي (CCP)',
    placeholder: 'مثال: 0012345678 كلي 34',
    hint: 'رقم الحساب البريدي مع المفتاح (8–20 رقماً)',
  },
  baridimob: {
    label: 'رقم RIP (باريدي موب)',
    placeholder: 'مثال: 00799990012345678901',
    hint: '20 رقماً — تجدها في تطبيق باريدي موب',
  },
  rib: {
    label: 'رقم الحساب البنكي (RIB)',
    placeholder: 'مثال: 00799880012345678901',
    hint: '20 رقماً — تجدها في كشف حسابك البنكي',
  },
};

function formatDZD(amount: number): string {
  return `${new Intl.NumberFormat('fr-DZ').format(amount)} دج`;
}

export default function VendorPayoutsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-payouts'],
    queryFn: () => payoutsApi.getMy(),
  });

  const balance = data?.data?.balance;
  const requests = data?.data?.requests ?? [];
  const minPayout = data?.data?.min_payout ?? 1000;

  // ── Form state ──
  const [method, setMethod] = useState('ccp');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: {
      amount: number;
      method: string;
      account_name: string;
      account_number: string;
    }) => payoutsApi.create(payload),
    onSuccess: (res) => {
      if (res?.status === 'sovereign_halt' || (res as { code?: string })?.code) {
        toast.error(res?.message_ar || 'تعذر إنشاء الطلب');
        return;
      }
      toast.success('تم إرسال طلب السحب — سيتم مراجعته من قبل الإدارة');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['my-payouts'] });
    },
    onError: () => toast.error('تعذر إنشاء الطلب — حاول مجدداً'),
  });

  const handleRequest = () => {
    const numericAmount = parseInt(amount, 10);
    if (!Number.isInteger(numericAmount) || numericAmount < minPayout) {
      toast.error(`أدنى مبلغ للسحب هو ${formatDZD(minPayout)}`);
      return;
    }
    if (balance && numericAmount > balance.available) {
      toast.error(`المبلغ يتجاوز رصيدك المتاح (${formatDZD(balance.available)})`);
      return;
    }
    if (accountName.trim().length < 3) {
      toast.error('أدخل اسم صاحب الحساب');
      return;
    }
    createMutation.mutate({
      amount: numericAmount,
      method,
      account_name: accountName.trim(),
      account_number: accountNumber,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <Landmark className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="font-bold">لم يتم ربط حسابك بمتجر</p>
          <p className="text-sm text-muted-foreground">
            تواصل مع الإدارة لربط حسابك بالمتجر وتفعيل سحب الأرباح.
          </p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'الرصيد المتاح للسحب',
      value: formatDZD(balance?.available ?? 0),
      icon: Banknote,
      tone: 'text-emerald-600',
    },
    {
      title: 'إجمالي الأرباح المكتسبة',
      value: formatDZD(balance?.earned ?? 0),
      icon: Wallet,
      tone: 'text-foreground',
    },
    {
      title: 'قيد السحب',
      value: formatDZD(balance?.committed ?? 0),
      icon: Clock,
      tone: 'text-amber-600',
    },
    {
      title: 'تم سحبه',
      value: formatDZD(balance?.withdrawn ?? 0),
      icon: CheckCircle2,
      tone: 'text-muted-foreground',
    },
  ];

  const field = METHOD_FIELDS[method];

  return (
    <div className="space-y-12">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">أرباحي وسحبها</h1>
        <p className="text-muted-foreground mt-2">
          أرباحك المكتسبة من تحرير الضمانات — اسحبها إلى حسابك البريدي أو البنكي.
        </p>
      </div>

      {/* ── Balance cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {s.title}
                </p>
                <s.icon className={`w-5 h-5 ${s.tone}`} />
              </div>
              <p className="mt-3 text-2xl font-black tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Request form ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Landmark className="w-5 h-5" />
            طلب سحب جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>طريقة السحب</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الطريقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ccp">حساب بريدي (CCP)</SelectItem>
                  <SelectItem value="baridimob">باريدي موب (RIP)</SelectItem>
                  <SelectItem value="rib">حساب بنكي (RIB)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-amount">المبلغ (دج)</Label>
              <div className="flex gap-2">
                <Input
                  id="payout-amount"
                  type="number"
                  inputMode="numeric"
                  min={minPayout}
                  max={balance?.available ?? 0}
                  placeholder={`بين ${minPayout} و ${balance?.available ?? 0}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(String(balance?.available ?? 0))}
                  disabled={!balance?.available}
                >
                  الكل
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-name">اسم صاحب الحساب</Label>
              <Input
                id="payout-name"
                placeholder="الاسم واللقب كما في الحساب"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payout-account">{field.label}</Label>
              <Input
                id="payout-account"
                placeholder={field.placeholder}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              {field.hint}. تتم معالجة طلبات السحب يدوياً من قبل الإدارة عبر بريد الجزائر أو
              البنوك، وقد يستغرق التحويل بضعة أيام عمل. سيصلك بريد إلكتروني عند كل تغيير حالة.
            </p>
          </div>

          <Button
            onClick={handleRequest}
            disabled={createMutation.isPending || !balance?.available}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Banknote className="w-4 h-4 ml-2" />
            )}
            إرسال طلب السحب
          </Button>
        </CardContent>
      </Card>

      {/* ── Requests history ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">سجل طلبات السحب</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              لا توجد طلبات سحب بعد — أرباحك تتراكم هنا كلما تحرر ضمان حجز.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الطريقة</TableHead>
                    <TableHead>الحساب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r: PayoutRequestDTO) => {
                    const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES.pending;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold tabular-nums">
                          {formatDZD(r.amount)}
                        </TableCell>
                        <TableCell className="text-sm">{r.method_label ?? r.method}</TableCell>
                        <TableCell className="text-sm font-mono" dir="ltr">
                          {r.account_number}
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
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString('ar-DZ')}
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
    </div>
  );
}
