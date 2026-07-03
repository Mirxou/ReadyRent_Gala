'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariantSelector } from '@/components/variant-selector';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

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
  availability_status: "in_stock" | "low_stock" | "out_of_stock" | "unknown";
  is_available: boolean;
}

export default function ProductVariantsPage() {
  const params = useParams();
  const { toast } = useToast();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    color: '',
    color_hex: '',
    style: '',
    price_per_day: '',
    is_active: true,
  });

  useEffect(() => {
    loadVariants();
  }, [params.id]);

  const loadVariants = async () => {
    try {
      const response = await api.get(`/products/${params.id}/variants/`);
      setVariants(response.data.results || response.data);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل تحميل المتغيرات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث المتغير بنجاح',
        });
      } else {
        await api.post('/products/admin/variants/', {
          ...formData,
          product: params.id,
          price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
        });
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة المتغير بنجاح',
        });
      }
      setShowForm(false);
      setEditingVariant(null);
      setFormData({
        name: '',
        size: '',
        color: '',
        color_hex: '',
        style: '',
        price_per_day: '',
        is_active: true,
      });
      loadVariants();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل حفظ المتغير',
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

  const handleDelete = async (variantId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتغير؟')) return;

    try {
      await api.delete(`/products/admin/variants/${variantId}/`);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المتغير بنجاح',
      });
      loadVariants();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل حذف المتغير',
        variant: 'destructive',
      });
    }
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
                  className="w-full px-4 py-2 border rounded-md"
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
              <Button onClick={handleSubmit}>
                {editingVariant ? 'تحديث' : 'إضافة'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingVariant(null); }}>
                إلغاء
              </Button>
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
                  <CardDescription>
                    SKU: {variant.sku} | {variant.size} - {variant.color}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(variant)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(variant.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="font-medium">{variant.price.toFixed(2)} دج/يوم</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <p className="font-medium">{variant.is_active ? 'نشط' : 'غير نشط'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التوفر</p>
                  <p className="font-medium">
                    {variant.availability_status === 'in_stock' && 'متوفر'}
                    {variant.availability_status === 'low_stock' && 'مخزون منخفض'}
                    {variant.availability_status === 'out_of_stock' && 'غير متوفر'}
                    {variant.availability_status === 'unknown' && 'غير معروف'}
                  </p>
                </div>
                {variant.color_hex && (
                  <div>
                    <p className="text-sm text-muted-foreground">اللون</p>
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: variant.color_hex }}
                    />
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
            <p className="text-muted-foreground">لا توجد متغيرات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


