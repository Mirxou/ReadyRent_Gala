'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Wallet, TrendingUp, Clock, CheckCircle2, Building2, Smartphone,
  ArrowDownToLine, Settings, Loader2, Shield
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Vendor Payouts — Money-Out Loop (P0)
// Lets vendors: see available earnings, configure CCP/BaridiMob,
// request withdrawals, and view withdrawal history.
// ═══════════════════════════════════════════════════════════════

interface BalanceData {
  available: number;
  processing: number;
  held_in_escrow: number;
  total_withdrawn: number;
  wallet_balance: number;
  pending_withdrawals: number;
  payout_account: {
    ccp_account: string | null;
    ccp_name: string | null;
    ccp_key: string | null;
    baridimob_phone: string | null;
    is_configured: boolean;
  } | null;
}

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  status: string;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'بانتظار المعالجة', color: 'bg-amber-500/10 text-amber-600' },
  PROCESSING: { label: 'قيد التحويل',     color: 'bg-blue-500/10 text-blue-600' },
  COMPLETED:  { label: 'تم التحويل',      color: 'bg-emerald-500/10 text-emerald-600' },
  REJECTED:   { label: 'مرفوض',           color: 'bg-red-500/10 text-red-600' },
};

export default function VendorPayoutsPage() {
  const { isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'CCP' | 'BARIDIMOB'>('CCP');

  // Settings form
  const [ccpAccount, setCcpAccount] = useState('');
  const [ccpName, setCcpName] = useState('');
  const [ccpKey, setCcpKey] = useState('');
  const [baridimobPhone, setBaridimobPhone] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [balRes, withRes] = await Promise.all([
        api.get('/wallet/balance/'),
        api.get('/wallet/payout-request/'),
      ]);
      setBalance(balRes.data?.data || balRes.data);
      const wData = Array.isArray(withRes.data?.data) ? withRes.data.data : Array.isArray(withRes.data) ? withRes.data : [];
      setWithdrawals(wData);

      // Pre-fill settings form
      const acc = balRes.data?.data?.payout_account;
      if (acc) {
        setCcpAccount(acc.ccp_account || '');
        setCcpName(acc.ccp_name || '');
        setBaridimobPhone(acc.baridimob_phone || '');
      }
    } catch {
      toast.error('فشل تحميل بيانات الأرباح');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
    else setLoading(false);
  }, [isAuthenticated, loadData]);

  const handleSaveSettings = async () => {
    try {
      // Find vendor ID and update
      const vendorRes = await api.get('/vendors/vendors/');
      const vendorId = vendorRes.data?.data?.[0]?.id || vendorRes.data?.[0]?.id;
      if (!vendorId) {
        toast.error('لم يتم العثور على حساب تاجر');
        return;
      }
      await api.patch(`/vendors/vendors/${vendorId}/`, {
        ccp_account: ccpAccount,
        ccp_name: ccpName,
        ccp_key: ccpKey || undefined,
        baridimob_phone: baridimobPhone,
      });
      toast.success('تم حفظ معلومات الدفع ✓');
      setShowSettings(false);
      loadData();
    } catch {
      toast.error('فشل حفظ المعلومات');
    }
  };

  const handleRequestPayout = async () => {
    if (!balance?.available || balance.available < 2000) {
      toast.error(`الحد الأدنى للسحب هو 2,000 دج — رصيدك: ${formatNumber(balance?.available || 0)} دج`);
      return;
    }
    setRequesting(true);
    try {
      const res = await api.post('/wallet/payout-request/', { method: payoutMethod });
      if (res.data?.success) {
        toast.success(res.data.data?.message || `تم استلام طلب سحب ${formatNumber(balance.available)} دج`);
        loadData();
      } else {
        toast.error(res.data?.message_en || 'فشل طلب السحب');
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message_ar?: string; message_en?: string } } })?.response?.data;
      toast.error(msg?.message_ar || msg?.message_en || 'فشل طلب السحب');
    } finally {
      setRequesting(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="container mx-auto py-20 text-center"><p className="text-muted-foreground">يرجى تسجيل الدخول</p></div>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">الأرباح والسحب</h1>
          <p className="text-muted-foreground mt-1">سحب أرباحك عبر حساب CCP أو BaridiMob</p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="gap-2">
          <Settings className="w-4 h-4" />
          إعدادات الدفع
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <Wallet className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{formatNumber(balance?.available || 0)}</p>
              <p className="text-xs text-muted-foreground">متاح للسحب</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600">{formatNumber(balance?.processing || 0)}</p>
              <p className="text-xs text-muted-foreground">قيد المعالجة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{formatNumber(balance?.held_in_escrow || 0)}</p>
              <p className="text-xs text-muted-foreground">محتجز في الضمان</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-500/10">
              <CheckCircle2 className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-black">{formatNumber(balance?.total_withdrawn || 0)}</p>
              <p className="text-xs text-muted-foreground">إجمالي المسحوب</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Settings Panel */}
      {showSettings && (
        <Card className="mb-6 ring-2 ring-blue-500">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              معلومات حساب الدفع
            </h3>
            <p className="text-sm text-muted-foreground">أدخل معلومات حسابك ليتم التحويل إليه عند طلب السحب</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">رقم حساب CCP</Label>
                <Input placeholder="0020010100123456 78" value={ccpAccount} onChange={(e) => setCcpAccount(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">الاسم واللقب (كما في الشيك)</Label>
                <Input placeholder="محمد أمين بن علي" value={ccpName} onChange={(e) => setCcpName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">مفتاح CCP (اختياري)</Label>
                <Input placeholder="1234" value={ccpKey} onChange={(e) => setCcpKey(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">رقم هاتف BaridiMob</Label>
                <Input placeholder="0770 123 456" value={baridimobPhone} onChange={(e) => setBaridimobPhone(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveSettings} className="gap-2">
                <CheckCircle2 className="w-4 h-4" /> حفظ
              </Button>
              <Button variant="ghost" onClick={() => setShowSettings(false)}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Request Panel */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">طلب سحب الأرباح</h3>
              <p className="text-sm text-muted-foreground">
                الرصيد المتاح: <span className="font-bold text-emerald-600">{formatNumber(balance?.available || 0)} دج</span>
                {balance && balance.available < 2000 && <span className="text-red-500 ml-2">(الحد الأدنى: 2,000 دج)</span>}
              </p>
            </div>
          </div>

          {/* Method selector */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setPayoutMethod('CCP')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                payoutMethod === 'CCP' ? 'border-blue-500 bg-blue-500/5' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Building2 className={`w-5 h-5 ${payoutMethod === 'CCP' ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className="text-right">
                <p className="font-bold text-sm">CCP (تحويل بريدي)</p>
                <p className="text-xs text-muted-foreground">تحويل بنكي إلى حساب CCP</p>
              </div>
            </button>
            <button
              onClick={() => setPayoutMethod('BARIDIMOB')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                payoutMethod === 'BARIDIMOB' ? 'border-blue-500 bg-blue-500/5' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Smartphone className={`w-5 h-5 ${payoutMethod === 'BARIDIMOB' ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className="text-right">
                <p className="font-bold text-sm">BaridiMob</p>
                <p className="text-xs text-muted-foreground">تحويل عبر تطبيق بريدي موب</p>
              </div>
            </button>
          </div>

          {/* Request button */}
          <Button
            onClick={handleRequestPayout}
            disabled={requesting || !balance?.available || balance.available < 2000}
            variant="default"
            size="lg"
            className="w-full gap-2"
          >
            {requesting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ المعالجة...</>
            ) : (
              <><ArrowDownToLine className="w-4 h-4" /> سحب {formatNumber(balance?.available || 0)} دج عبر {payoutMethod === 'CCP' ? 'CCP' : 'BaridiMob'}</>
            )}
          </Button>

          {!balance?.payout_account?.is_configured && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              ⚠️ يرجى إعداد معلومات الدفع أولاً قبل طلب السحب
            </p>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4">سجل المسحوبات</h3>
          {withdrawals.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">لا توجد طلبات سحب بعد</p>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => {
                const conf = STATUS_CONFIG[w.status] || STATUS_CONFIG.PENDING;
                return (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        {w.method === 'CCP' ? <Building2 className="w-4 h-4 text-blue-500" /> : <Smartphone className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{formatNumber(w.amount)} دج</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(w.requested_at).toLocaleDateString('ar-EG')} — {w.method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.admin_note && <span className="text-xs text-muted-foreground">{w.admin_note}</span>}
                      <Badge className={conf.color}>{conf.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2">
        <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          يتم معالجة طلبات السحب يدوياً من قبل الإدارة خلال 48 ساعة.
          يتم التحويل عبر CCP أو BaridiMob حسب المعلومات المُدخلة.
          الحد الأدنى للسحب: 2,000 دج.
        </p>
      </div>
    </div>
  );
}
