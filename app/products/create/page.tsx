'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  ImageIcon,
  Tag,
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import { adminApi, productsApi } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface Category {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  product_count: number;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Form fields
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const userRole = user?.role;
  const canCreate = isAuthenticated && (userRole === 'admin' || userRole === 'staff' || userRole === 'vendor');

  // Fetch categories
  useEffect(() => {
    productsApi
      .getCategories()
      .then((res) => {
        if (res.data) setCategories(res.data);
      })
      .catch(() => {
        toast.error('فشل تحميل التصنيفات');
      })
      .finally(() => setIsCategoriesLoading(false));
  }, []);

  // Add size to list
  const addSize = useCallback(() => {
    const trimmed = newSize.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed]);
      setNewSize('');
    }
  }, [newSize, sizes]);

  // Remove size from list
  const removeSize = useCallback((index: number) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add color to list
  const addColor = useCallback(() => {
    const trimmed = newColor.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors((prev) => [...prev, trimmed]);
      setNewColor('');
    }
  }, [newColor, colors]);

  // Remove color from list
  const removeColor = useCallback((index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Form validation
  const isValid = nameAr.trim().length > 0 && Number(dailyRate) > 0;

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    setIsLoading(true);
    try {
      const res = await adminApi.createProduct({
        name_ar: nameAr.trim(),
        description_ar: description.trim(),
        daily_rate: Number(dailyRate),
        category_id: categoryId || undefined,
        is_available: isAvailable,
        sizes,
        colors,
      });

      if (res.meta?.failed) {
        toast.error('فشل الاتصال بالخادم');
        return;
      }

      if (res.data?.id) {
        toast.success('تم إنشاء المنتج بنجاح');
        router.push(`/products/${res.data.id}`);
      } else {
        toast.error(res.data?.message_en || 'حدث خطأ أثناء إنشاء المنتج');
      }
    } catch {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
              <Tag className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <h2 className="text-2xl font-black text-foreground">سجّل الدخول لإضافة منتج</h2>
            <p className="text-muted-foreground max-w-md">تحتاج إلى حساب مزوّد لإضافة منتجات جديدة.</p>
            <Link href="/login">
              <SovereignButton variant="primary" size="lg" withShimmer>
                الدخول إلى الحساب
              </SovereignButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not vendor/admin
  if (!canCreate) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
              <Tag className="w-10 h-10 text-red-500/40" />
            </div>
            <h2 className="text-2xl font-black text-foreground">الوصول مقيّد</h2>
            <p className="text-muted-foreground max-w-md">
              فقط المزوّدين والإداريين يمكنهم إضافة منتجات. تواصل معنا لترقية حسابك.
            </p>
            <Link href="/products">
              <SovereignButton variant="secondary">تصفح المنتجات</SovereignButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen bg-sovereign-obsidian pt-24 pb-16"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-white/40 hover:text-sovereign-gold text-xs font-black uppercase tracking-widest mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" /> العودة للمنتجات
          </Link>
          <h1 className="text-4xl font-black italic">
            إضافة <span className="text-sovereign-gold">منتجك</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            أضف أصلك إلى سجل النخبة السيادي
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <GlassPanel className="p-8 md:p-10 space-y-8" variant="obsidian" gradientBorder>
            {/* Product Name */}
            <div className="space-y-3">
              <Label htmlFor="nameAr" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                اسم المنتج (بالعربية) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nameAr"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: فستان زفاف جزائري ذهبي"
                className="h-12 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                الوصف
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="صف المنتج بالتفصيل: الحالة، المواد، المميزات..."
                className="min-h-[120px] bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 resize-none"
                rows={5}
              />
            </div>

            {/* Daily Rate + Category (side by side on desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Rate */}
              <div className="space-y-3">
                <Label htmlFor="dailyRate" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  السعر اليومي (د.ج) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="dailyRate"
                    type="number"
                    min="1"
                    step="1"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    placeholder="5000"
                    className="h-12 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/40 uppercase">DA</span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  التصنيف
                </Label>
                {isCategoriesLoading ? (
                  <div className="h-12 bg-white/5 border border-white/10 rounded-md flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/40" />
                  </div>
                ) : (
                  <Select value={categoryId} onValueChange={setCategoryId} dir="rtl">
                    <SelectTrigger className="h-12 w-full bg-white/5 border-white/10 text-foreground">
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_ar}
                          <span className="text-muted-foreground/40 mr-2 text-xs">({cat.product_count})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="font-bold text-foreground text-sm">متاح للإيجار</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">سيظهر المنتج في نتائج البحث عند التفعيل</p>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>

            {/* Sizes */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                المقاسات
              </Label>
              <div className="flex gap-3">
                <Input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                  placeholder="مثال: S, M, L, XL"
                  className="h-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 flex-1"
                />
                <SovereignButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addSize}
                  disabled={!newSize.trim()}
                  className="h-10 px-4"
                >
                  <Plus className="w-4 h-4" />
                </SovereignButton>
              </div>
              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {sizes.map((size, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-sovereign-gold/10 border-sovereign-gold/20 text-sovereign-gold px-3 py-1 text-xs font-bold gap-1.5"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeSize(i)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                الألوان المتاحة
              </Label>
              <div className="flex gap-3">
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                  placeholder="مثال: ذهبي، أحمر، أبيض"
                  className="h-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 flex-1"
                />
                <SovereignButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addColor}
                  disabled={!newColor.trim()}
                  className="h-10 px-4"
                >
                  <Plus className="w-4 h-4" />
                </SovereignButton>
              </div>
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((color, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-white/5 border-white/10 text-foreground px-3 py-1 text-xs font-bold gap-1.5"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColor(i)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Image placeholder notice */}
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 border-dashed">
              <ImageIcon className="w-5 h-5 text-muted-foreground/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">رفع الصور</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  يمكنك إضافة الصور لاحقاً من صفحة تعديل المنتج بعد الإنشاء.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <SovereignButton
                type="submit"
                variant="primary"
                size="lg"
                withShimmer
                disabled={!isValid || isLoading}
                className="w-full sm:w-auto px-12 h-14 text-sm font-black"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'إضافة المنتج للسجل السيادي'
                )}
              </SovereignButton>
              <Link href="/products" className="w-full sm:w-auto">
                <SovereignButton type="button" variant="secondary" size="lg" className="w-full sm:w-auto px-8 h-14 text-sm">
                  إلغاء
                </SovereignButton>
              </Link>
            </div>
          </GlassPanel>
        </form>
      </div>
    </motion.div>
  );
}
