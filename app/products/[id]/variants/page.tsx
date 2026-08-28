'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { Plus, Edit, Trash2, ShieldAlert, Construction } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProductVariant {
  id: number;
  name: string;
  size: string;
  color: string;
  color_hex: string;
  style: string;
  sku: string;
  price_per_day?: number;
  price: number;
  is_active: boolean;
  availability_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  is_available: boolean;
}

const AVAILABILITY_MAP: Record<string, string> = {
  in_stock: 'متوفر',
  low_stock: 'مخزون منخفض',
  out_of_stock: 'غير متوفر',
  unknown: 'غير معروف',
};

export default function ProductVariantsPage() {
  const params = useParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    color: '',
    color_hex: '',
    style: '',
    price_per_day: '',
    is_active: true,
  });

  const loadVariants = async () => {
    try {
      const response = await api.get(`/products/${params.id}/variants/`);
      const data = response.data?.results ?? response.data ?? [];
      setVariants(data as ProductVariant[]);
    } catch (error: unknown) {
      toast({
        title: 'خطأ',
        description: (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'فشل تحميل المتغيرات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Role guard (before any API calls) ──
  const hasRole = isAuthenticated && (user?.role === 'admin' || user?.role === 'staff' || user?.role === 'vendor');

  useEffect(() => {
    if (hasRole) {
      requestAnimationFrame(() => { loadVariants(); });
    }
  }, [params.id, hasRole]);

  if (!hasRole) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">الوصول مقيّد</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة للمسؤولين والمزوّدين فقط.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.size || !formData.color) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingVariant) {
        await api.patch(`/products/admin/variants/${editingVariant.id}/`, {
          ...formData,
          product: params.id,
          price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
        });
        toast({ title: 'تم التحديث', description: 'تم تحديث المتغير بنجاح' });
      } else {
        await api.post('/products/admin/variants/', {
          ...formData,
          product: params.id,
          price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
        });
        toast({ title: 'تم الإضافة', description: 'تم إضافة المتغير بنجاح' });
      }
      setShowForm(false);
      setEditingVariant(null);
      setFormData({ name: '', size: '', color: '', color_hex: '', style: '', price_per_day: '', is_active: true });
      loadVariants();
    } catch (error: unknown) {
      toast({
        title: 'خطأ',
        description: (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'فشل حفظ المتغير',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      size: variant.size,
      color: variant.color,
      color_hex: variant.color_hex || '',
      style: variant.style || '',
      price_per_day: variant.price_per_day?.toString() || '',
      is_active: variant.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const variantId = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await api.delete(`/products/admin/variants/${variantId}/`);
      toast({ title: 'تم الحذف', description: 'تم حذف المتغير بنجاح' });
      loadVariants();
    } catch (error: unknown) {
      toast({
        title: 'خطأ',
        description: (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'فشل حذف المتغير',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingVariant(null);
    setFormData({ name: '', size: '', color: '', color_hex: '', style: '', price_per_day: '', is_active: true });
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المتغيرات</h1>
          <p className="text-muted-foreground">إدارة الأحجام والألوان للمنتج</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingVariant(null); }}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة متغير جديد
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingVariant ? 'تعديل المتغير' : 'إضافة متغير جديد'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: Size M - Red"
                />
              </div>
              <div>
                <Label htmlFor="size">الحجم</Label>
                <select
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md bg-background"
                >
                  <option value="">اختر الحجم</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
              <div>
                <Label htmlFor="color">اللون</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="مثال: أحمر"
                />
              </div>
              <div>
                <Label htmlFor="color_hex">رمز اللون (Hex)</Label>
                <Input
                  id="color_hex"
                  value={formData.color_hex}
                  onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                  placeholder="#FF5733"
                />
              </div>
              <div>
                <Label htmlFor="style">النمط</Label>
                <Input
                  id="style"
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  placeholder="اختياري"
                />
              </div>
              <div>
                <Label htmlFor="price_per_day">السعر/اليوم (دج)</Label>
                <Input
                  id="price_per_day"
                  type="number"
                  value={formData.price_per_day}
                  onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                  placeholder="اتركه فارغاً لاستخدام سعر المنتج"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">نشط</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingVariant ? 'تحديث' : 'إضافة'}</Button>
              <Button variant="outline" onClick={resetForm}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {variants.map((variant) => (
          <Card key={variant.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{variant.name}</CardTitle>
                  <CardDescription>SKU: {variant.sku} | {variant.size} - {variant.color}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                    {variant.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(variant)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(variant)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="font-medium">{(variant.price ?? 0).toFixed(2)} دج/يوم</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التوفر</p>
                  <p className="font-medium">{AVAILABILITY_MAP[variant.availability_status] || variant.availability_status}</p>
                </div>
                {variant.color_hex && (
                  <div>
                    <p className="text-sm text-muted-foreground">اللون</p>
                    <div className="w-8 h-8 rounded border" style={{ backgroundColor: variant.color_hex }} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {variants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Construction className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">لا توجد متغيرات</p>
            <p className="text-xs text-muted-foreground/60">المتغيرات (أحجام، ألوان) تُدار من هنا عند تفعيل API المتغيرات.</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المتغير</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف متغير &quot;{deleteTarget?.name}&quot;; لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
