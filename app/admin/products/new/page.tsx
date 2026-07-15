'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, ImageIcon, CheckCircle } from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface Category {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
}

interface ProductData {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar?: string | null;
  daily_rate: number | null;
  primary_image: string | null;
  images: string | string[];
  sizes: string | string[];
  colors: string | string[];
  is_available: boolean;
  category: Category | null;
  category_id: string;
}

interface FormState {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  daily_rate: string;
  category_id: string;
  images_urls: string;
  color: string;
  size: string;
  is_available: boolean;
}

/* ────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────── */

function safeJsonParse(str: unknown, fallback: string[]): string[] {
  if (Array.isArray(str)) return str;
  if (typeof str === 'string') {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }
  return fallback;
}

function arrayToCsv(arr: string[]): string {
  return arr.join(', ');
}

/* ────────────────────────────────────────────────
   Form Component (needs Suspense boundary for useSearchParams)
   ──────────────────────────────────────────────── */

function ProductForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('editId');
  const isEditMode = !!editId;

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState<FormState>({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    daily_rate: '',
    category_id: '',
    images_urls: '',
    color: '',
    size: '',
    is_available: true,
  });

  // ── Fetch categories ──
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/products/categories');
        const json = await res.json();
        if (json.success && json.data) {
          setCategories(json.data);
        }
      } catch {
        toast.error('حدث خطأ أثناء تحميل التصنيفات');
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  // ── Fetch product for edit ──
  useEffect(() => {
    if (!editId) return;

    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/admin/${editId}`);
        const json = await res.json();

        if (!json.success) {
          toast.error('المنتج غير موجود');
          router.push('/admin/products');
          return;
        }

        const p: ProductData = json.data;
        const parsedImages = safeJsonParse(p.images, []);
        const parsedSizes = safeJsonParse(p.sizes, []);
        const parsedColors = safeJsonParse(p.colors, []);

        setForm({
          name_ar: p.name_ar ?? '',
          name_en: p.name ?? '',
          description_ar: p.description_ar ?? p.description ?? '',
          description_en: p.description ?? '',
          daily_rate: p.daily_rate ? String(p.daily_rate) : '',
          category_id: p.category_id ?? '',
          images_urls: arrayToCsv(parsedImages),
          color: arrayToCsv(parsedColors),
          size: arrayToCsv(parsedSizes),
          is_available: p.is_available ?? true,
        });
      } catch {
        toast.error('حدث خطأ أثناء تحميل بيانات المنتج');
      } finally {
        setProductLoading(false);
      }
    }
    loadProduct();
  }, [editId, router]);

  // ── Form change handler ──
  const updateField = useCallback((field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Submit handler ──
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation
      if (!form.name_ar.trim() && !form.name_en.trim()) {
        toast.error('يجب إدخال اسم المنتج بالعربية أو الإنجليزية');
        return;
      }
      if (!form.daily_rate || Number(form.daily_rate) <= 0) {
        toast.error('يجب إدخال سعر يومي صحيح');
        return;
      }

      // Parse images/colors/sizes
      const imagesArray = form.images_urls
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
      const colorsArray = form.color
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const sizesArray = form.size
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const body = {
        name: form.name_en.trim() || form.name_ar.trim(),
        name_ar: form.name_ar.trim() || form.name_en.trim(),
        description: form.description_en.trim(),
        description_ar: form.description_ar.trim(),
        daily_rate: Number(form.daily_rate),
        category_id: form.category_id || null,
        images: imagesArray,
        sizes: sizesArray,
        colors: colorsArray,
        is_available: form.is_available,
        primary_image: imagesArray[0] || null,
      };

      setSubmitting(true);

      try {
        const url = isEditMode ? `/api/products/admin/${editId}` : '/api/products/admin';
        const method = isEditMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const json = await res.json();

        if (json.success) {
          toast.success(isEditMode ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح');
          router.push('/admin/products');
        } else {
          const msg = json.message_en || json.message_ar || 'حدث خطأ غير متوقع';
          toast.error(msg);
        }
      } catch {
        toast.error('حدث خطأ أثناء حفظ المنتج');
      } finally {
        setSubmitting(false);
      }
    },
    [form, editId, isEditMode, router]
  );

  // ── Loading state ──
  if (productLoading) {
    return (
      <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Skeleton className="h-6 w-40 mb-8 bg-white/10" />
          <Skeleton className="h-12 w-72 mb-8 bg-white/10" />
          <GlassPanel className="p-10" variant="obsidian" gradientBorder>
            <div className="space-y-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-white/10" />
                  <Skeleton className="h-11 w-full bg-white/5" />
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* ── Breadcrumb ── */}
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-white/40 hover:text-sovereign-gold text-xs font-black uppercase tracking-widest mb-8 transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          العودة للمنتجات
        </Link>

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-black italic">
            {isEditMode ? (
              <>
                تعديل <span className="text-sovereign-gold">المنتج</span>
              </>
            ) : (
              <>
                إضافة <span className="text-sovereign-gold">منتج جديد</span>
              </>
            )}
          </h1>
          {isEditMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sovereign-gold/10 border border-sovereign-gold/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sovereign-gold">
              <CheckCircle className="w-3 h-3" />
              وضع التعديل
            </span>
          )}
        </div>

        {/* ── Form ── */}
        <GlassPanel className="p-6 sm:p-10" variant="obsidian" gradientBorder>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ─── Arabic Name ─── */}
            <div className="space-y-2.5">
              <Label htmlFor="name_ar" className="text-white/80 text-sm font-bold">
                اسم المنتج بالعربية <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name_ar"
                value={form.name_ar}
                onChange={(e) => updateField('name_ar', e.target.value)}
                placeholder="مثال: فستان سهرة ذهبي"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sovereign-gold/50 focus:ring-sovereign-gold/20 rounded-xl text-right"
                dir="rtl"
              />
            </div>

            {/* ─── English Name ─── */}
            <div className="space-y-2.5">
              <Label htmlFor="name_en" className="text-white/80 text-sm font-bold">
                اسم المنتج بالإنجليزية
              </Label>
              <Input
                id="name_en"
                value={form.name_en}
                onChange={(e) => updateField('name_en', e.target.value)}
                placeholder="e.g. Golden Evening Gown"
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sovereign-gold/50 focus:ring-sovereign-gold/20 rounded-xl text-left"
                dir="ltr"
              />
            </div>

            {/* ─── Arabic Description ─── */}
            <div className="space-y-2.5">
              <Label htmlFor="description_ar" className="text-white/80 text-sm font-bold">
                الوصف بالعربية
              </Label>
              <Textarea
                id="description_ar"
                value={form.description_ar}
                onChange={(e) => updateField('description_ar', e.target.value)}
                placeholder="أدخل وصف تفصيلي للمنتج باللغة العربية..."
                className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sovereign-gold/50 focus:ring-sovereign-gold/20 rounded-xl resize-none text-right leading-relaxed"
                dir="rtl"
              />
            </div>

            {/* ─── English Description ─── */}
            <div className="space-y-2.5">
              <Label htmlFor="description_en" className="text-white/80 text-sm font-bold">
                الوصف بالإنجليزية
              </Label>
              <Textarea
                id="description_en"
                value={form.description_en}
                onChange={(e) => updateField('description_en', e.target.value)}
                placeholder="Enter a detailed product description in English..."
                className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sovereign-gold/50 focus:ring-sovereign-gold/20 rounded-xl resize-none text-left leading-relaxed"
                dir="ltr"
              />
            </div>

            {/* ─── Price & Category ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Daily Rate */}
              <div className="space-y-2.5">
                <Label htmlFor="daily_rate" className="text-white/80 text-sm font-bold">
                  السعر اليومي (دج) <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="daily_rate"
                    type="number"
                    min="0"
                    step="1"
                    value={form.daily_rate}
                    onChange={(e) => updateField('daily_rate', e.target.value)}
                    placeholder="0"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sovereign-gold/50 focus:ring-sovereign-gold/20 rounded-xl text-left"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">
                    دج / يوم
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2.5">
                <Label className="text-white/80 text-sm font-bold">
                  التصنيف
                </Label>
                {categoriesLoading ? (
                  <Skeleton className="h-12 w-full bg-white/5 rounded-xl" />
                ) : (
                  <Select
                    value={form.category_id}
                    onValueChange={(val) => updateField('category_id', val)}
                  >
                    <SelectTrigger className="h-12 w-full bg-white/5 border-white/10 text-white data-[placeholder]:text-white/25 rounded-xl">
                      <SelectValue placeholder="اختر التصنيف..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* ─── Color & Size ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Colors */}
              <div className="space-y-2.5">
                <Label htmlFor="color" className="text-white/80 text-sm font-bold">
                  الألوان المتاحة
                </Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={(e) => updateField('color', e.target.value)}
                  placeholder="أحمر، أزرق، ذهبي"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sovereign-gold/50 focus:ring-sovereign-gold/20 rounded-xl text-right"
                  dir="rtl"
                />
                <p className="text-white/25 text-xs">افصل بين الألوان بفواصل</p>
              </div>

              {/* Sizes */}
              <div className="space-y-2.5">
                <Label htmlFor="size" className="text-white/80 text-sm font-bold">
                  المقاسات المتاحة
                </Label>
                <Input
                  id="size"
                  value={form.size}
                  onChange={(e) => updateField('size', e.target.value)}
                  placeholder="S، M، L، XL"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sovereign-gold/50 focus:ring-sovereign-gold/20 rounded-xl text-right"
                  dir="rtl"
                />
                <p className="text-white/25 text-xs">افصل بين المقاسات بفواصل</p>
              </div>
            </div>

            {/* ─── Images ─── */}
            <div className="space-y-2.5">
              <Label htmlFor="images" className="text-white/80 text-sm font-bold">
                <span className="inline-flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sovereign-gold/60" />
                  روابط الصور
                </span>
              </Label>
              <Textarea
                id="images"
                value={form.images_urls}
                onChange={(e) => updateField('images_urls', e.target.value)}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-sovereign-gold/50 focus:ring-sovereign-gold/20 rounded-xl resize-none text-left leading-relaxed font-mono text-sm"
                dir="ltr"
              />
              <p className="text-white/25 text-xs">
                أدخل روابط الصور مفصولة بفواصل. الصورة الأولى ستكون الصورة الرئيسية.
              </p>
            </div>

            {/* ─── Availability Toggle ─── */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="space-y-1">
                <Label className="text-white/90 text-sm font-bold cursor-pointer">
                  حالة التوفر
                </Label>
                <p className="text-white/30 text-xs">
                  {form.is_available ? 'المنتج متاح للإيجار حالياً' : 'المنتج غير متاح للإيجار'}
                </p>
              </div>
              <Switch
                checked={form.is_available}
                onCheckedChange={(checked) => updateField('is_available', checked)}
                className="data-[state=checked]:bg-sovereign-gold"
              />
            </div>

            {/* ─── Actions ─── */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
              <SovereignButton
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
                isLoading={submitting}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {isEditMode ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </SovereignButton>

              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto text-white/40 hover:text-white/70 hover:bg-white/5"
                onClick={() => router.push('/admin/products')}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </GlassPanel>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Page Export (wrapped in Suspense for useSearchParams)
   ──────────────────────────────────────────────── */

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sovereign-obsidian pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-sovereign-gold animate-spin" />
          </div>
        </div>
      }
    >
      <ProductForm />
    </Suspense>
  );
}