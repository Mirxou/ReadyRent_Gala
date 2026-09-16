'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { Package, TrendingUp, Shield, Lightbulb, Edit, Check, X, Plus, DollarSign } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Vendor Product Management — Stage 4: Smart Deposit Control
// Lets merchants manage their products with:
//   - 4 deposit modes (RECOMMENDED / PERCENTAGE / FIXED / NONE)
//   - Multi-unit pricing (pricePerHour / pricePerDay / pricePerMonth)
//   - Smart recommendation display with conversion lift
//   - KYC gate settings (minTrustScore + requiredKycTier)
// ═══════════════════════════════════════════════════════════════

interface VendorProduct {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  price_per_day: number;
  price_per_hour?: number | null;
  price_per_month?: number | null;
  supported_units: string;
  deposit_mode: string;
  custom_deposit_val?: number | null;
  deposit_percentage: number;
  min_trust_score: number;
  required_kyc_tier: string;
  turnaround_hours: number;
  is_available: boolean;
  attributes?: Record<string, unknown> | null;
  category?: { name_ar?: string; slug?: string };
}

const DEPOSIT_MODES = [
  { value: 'RECOMMENDED', label: 'تلقائي (موصى به)', desc: 'النظام يقترح النسبة المثلى' },
  { value: 'PERCENTAGE', label: 'نسبة مخصصة', desc: 'أدخل أي نسبة (10%، 15%، 20%)' },
  { value: 'FIXED', label: 'مبلغ ثابت', desc: 'قيمة محددة بالدينار' },
  { value: 'NONE', label: 'بدون ضمان', desc: '0 دج — لزيادة الطلب' },
];

const KYC_TIERS = [
  { value: 'NONE', label: 'لا شيء' },
  { value: 'BASIC', label: 'أساسي (هوية موثقة)' },
  { value: 'ADVANCED', label: 'متقدم (هوية + تزكيات)' },
];

export default function VendorProductsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VendorProduct>>({});

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/products/admin/?limit=100');
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setProducts(data);
    } catch {
      // Fallback: try public products list
      try {
        const res = await api.get('/products/?limit=100');
        const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setProducts(data);
      } catch {
        toast.error('فشل تحميل المنتجات');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadProducts();
    else setLoading(false);
  }, [isAuthenticated, loadProducts]);

  const startEdit = (p: VendorProduct) => {
    setEditingId(p.id);
    setEditForm({
      deposit_mode: p.deposit_mode || 'RECOMMENDED',
      custom_deposit_val: p.custom_deposit_val,
      min_trust_score: p.min_trust_score,
      required_kyc_tier: p.required_kyc_tier,
      price_per_hour: p.price_per_hour,
      price_per_month: p.price_per_month,
      supported_units: p.supported_units || 'DAY',
      turnaround_hours: p.turnaround_hours,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (productId: string) => {
    try {
      await api.patch(`/products/admin/${productId}/`, editForm);
      toast.success('تم تحديث المنتج بنجاح ✓');
      setEditingId(null);
      setEditForm({});
      loadProducts();
    } catch {
      toast.error('فشل التحديث — تحقق من الصلاحيات');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-muted-foreground">يرجى تسجيل الدخول للوصول إلى لوحة المنتجات</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">إدارة المنتجات</h1>
          <p className="text-muted-foreground mt-1">تحكم في الأسعار، الضمان، وبوابات الأمان لكل منتج</p>
        </div>
        <Button variant="default" className="gap-2">
          <Plus className="w-4 h-4" />
          منتج جديد
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-black">{products.length}</p>
              <p className="text-xs text-muted-foreground">منتج</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-black">{products.filter(p => p.deposit_mode === 'RECOMMENDED').length}</p>
              <p className="text-xs text-muted-foreground">ضمان تلقائي</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-black">{products.filter(p => p.deposit_mode === 'NONE').length}</p>
              <p className="text-xs text-muted-foreground">بدون ضمان</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-black">{products.filter(p => (p.supported_units || 'DAY').includes('HOUR')).length}</p>
              <p className="text-xs text-muted-foreground">بالساعة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد منتجات بعد — أضف منتجك الأول</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <Card key={p.id} className={isEditing ? 'ring-2 ring-blue-500' : ''}>
                <CardContent className="p-6">
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-black">
                        {(p.name_ar || p.name || '?').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{p.name_ar || p.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{p.category?.name_ar || 'عام'}</Badge>
                          {p.is_available ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600">متاح</Badge>
                          ) : (
                            <Badge variant="destructive">غير متاح</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" variant="default" onClick={() => saveEdit(p.id)} className="gap-1">
                            <Check className="w-4 h-4" /> حفظ
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="gap-1">
                            <X className="w-4 h-4" /> إلغاء
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="gap-1">
                          <Edit className="w-4 h-4" /> تعديل
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Price */}
                    <div className="p-3 bg-muted/30 rounded-xl">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">السعر</p>
                      <p className="font-bold">
                        {formatNumber(p.price_per_day)} دج
                        <span className="text-xs text-muted-foreground ml-1">
                          /{(p.supported_units || 'DAY').split(',')[0] === 'HOUR' ? 'ساعة' : 'يوم'}
                        </span>
                      </p>
                      {p.price_per_hour && (
                        <p className="text-xs text-muted-foreground mt-1">{formatNumber(p.price_per_hour)} دج/ساعة</p>
                      )}
                    </div>

                    {/* Deposit Mode */}
                    <div className="p-3 bg-muted/30 rounded-xl">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">وضع الضمان</p>
                      {isEditing ? (
                        <Select
                          value={editForm.deposit_mode || 'RECOMMENDED'}
                          onValueChange={(v) => setEditForm({ ...editForm, deposit_mode: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPOSIT_MODES.map(m => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-bold text-sm">{DEPOSIT_MODES.find(m => m.value === (p.deposit_mode || 'RECOMMENDED'))?.label || 'تلقائي'}</span>
                        </div>
                      )}
                      {/* Show custom value if PERCENTAGE or FIXED */}
                      {isEditing && (editForm.deposit_mode === 'PERCENTAGE' || editForm.deposit_mode === 'FIXED') && (
                        <Input
                          type="number"
                          placeholder={editForm.deposit_mode === 'PERCENTAGE' ? 'النسبة %' : 'المبلغ بالدينار'}
                          value={editForm.custom_deposit_val ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, custom_deposit_val: parseInt(e.target.value) || 0 })}
                          className="h-8 mt-1 text-xs"
                        />
                      )}
                    </div>

                    {/* KYC Gate */}
                    <div className="p-3 bg-muted/30 rounded-xl">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">بوابة الأمان</p>
                      {isEditing ? (
                        <>
                          <Select
                            value={editForm.required_kyc_tier || 'NONE'}
                            onValueChange={(v) => setEditForm({ ...editForm, required_kyc_tier: v })}
                          >
                            <SelectTrigger className="h-8 text-xs mb-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {KYC_TIERS.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="الحد الأدنى للثقة"
                            value={editForm.min_trust_score ?? 0}
                            onChange={(e) => setEditForm({ ...editForm, min_trust_score: parseInt(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </>
                      ) : (
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {KYC_TIERS.find(t => t.value === (p.required_kyc_tier || 'NONE'))?.label || 'لا شيء'}
                          </Badge>
                          {p.min_trust_score > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">ثقة ≥ {p.min_trust_score}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Turnaround */}
                    <div className="p-3 bg-muted/30 rounded-xl">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">فترة التجهيز</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          placeholder="ساعات"
                          value={editForm.turnaround_hours ?? 24}
                          onChange={(e) => setEditForm({ ...editForm, turnaround_hours: parseInt(e.target.value) || 24 })}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <p className="font-bold text-sm">{p.turnaround_hours || 24} ساعة</p>
                      )}
                    </div>
                  </div>

                  {/* Smart Recommendation Banner */}
                  {(p.deposit_mode === 'RECOMMENDED' || !p.deposit_mode) && !isEditing && (
                    <div className="mt-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-muted-foreground">
                        <span className="font-bold text-blue-600">💡 الاقتراح الموصى به: </span>
                        {p.deposit_percentage || 30}% — نظام ذكي يحلل فئة المنتج ومستوى المخاطر
                        <span className="text-emerald-600 font-bold ml-2">↑ يرفع التحويل بنسبة 40%+</span>
                      </div>
                    </div>
                  )}

                  {/* Supported Units (edit mode) */}
                  {isEditing && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">الوحدات المدعومة (مفصولة بفواصل)</Label>
                        <Input
                          placeholder="DAY, HOUR"
                          value={editForm.supported_units || 'DAY'}
                          onChange={(e) => setEditForm({ ...editForm, supported_units: e.target.value.toUpperCase() })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">سعر بالشهر (اختياري)</Label>
                        <Input
                          type="number"
                          placeholder="بالدينار"
                          value={editForm.price_per_month ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, price_per_month: parseInt(e.target.value) || undefined })}
                          className="h-8 text-xs"
                        />
                      </div>
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
