'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { cmsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// ──── Types matching actual CMSPage model ────
interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-\u0600-\u06FF]+/g, '')
    .replace(/\-+/g, '-');
}

export default function CMSPagesPage() {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false); // false = list view, true = form view
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cmsApi.getPages({ all: 'true' });
      setPages(res.data || []);
    } catch {
      toast.error('فشل تحميل الصفحات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const openCreate = () => {
    setSelectedId(null);
    setForm({ title: '', slug: '', content: '', status: 'draft' });
    setEditing(true);
  };

  const openEdit = (page: CMSPage) => {
    setSelectedId(page.id);
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      status: page.status as 'draft' | 'published',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('العنوان مطلوب');
      return;
    }

    setSaving(true);
    try {
      if (selectedId) {
        await cmsApi.update(selectedId, form);
        toast.success('تم تحديث الصفحة بنجاح');
      } else {
        await cmsApi.create(form);
        toast.success('تم إنشاء الصفحة بنجاح');
      }
      setEditing(false);
      fetchPages();
    } catch (err: any) {
      const msg = err?.data?.message_en || 'حدث خطأ أثناء الحفظ';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصفحة؟')) return;

    setDeletingId(id);
    try {
      await cmsApi.delete(id);
      toast.success('تم حذف الصفحة بنجاح');
      fetchPages();
    } catch {
      toast.error('فشل حذف الصفحة');
    } finally {
      setDeletingId(null);
    }
  };

  // ──── Form View ────
  if (editing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للقائمة
          </button>
          <h1 className="text-3xl font-bold">
            {selectedId ? 'تعديل الصفحة' : 'إنشاء صفحة جديدة'}
          </h1>
        </div>

        <GlassPanel className="max-w-3xl mx-auto !p-6">
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                placeholder="أدخل عنوان الصفحة"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm({
                    ...form,
                    title,
                    // Auto-generate slug from title when creating new page
                    slug: selectedId ? form.slug : slugify(title),
                  });
                }}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">الرابط (Slug)</Label>
              <Input
                id="slug"
                placeholder="page-slug"
                dir="ltr"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">المحتوى</Label>
              <Textarea
                id="content"
                placeholder="أدخل محتوى الصفحة..."
                rows={12}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="resize-y"
              />
            </div>

            {/* Status Toggle */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: 'draft' })}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.status === 'draft'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  مسودة
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: 'published' })}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.status === 'published'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  منشور
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <SovereignButton
                variant="primary"
                size="md"
                isLoading={saving}
                onClick={handleSave}
              >
                {selectedId ? 'حفظ التعديلات' : 'إنشاء الصفحة'}
              </SovereignButton>
              <SovereignButton
                variant="secondary"
                size="md"
                onClick={() => setEditing(false)}
              >
                إلغاء
              </SovereignButton>
            </div>
          </div>
        </GlassPanel>
      </div>
    );
  }

  // ──── List View ────
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">إدارة الصفحات</h1>
          <p className="text-muted-foreground text-sm">
            إدارة الصفحات الثابتة للموقع
          </p>
        </div>
        <SovereignButton variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          صفحة جديدة
        </SovereignButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <GlassPanel className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">لا توجد صفحات بعد</p>
          <p className="text-sm text-muted-foreground mt-1">
            أنشئ أول صفحة لك
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {pages.map((page) => (
            <GlassPanel key={page.id} className="!p-4 !rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Page Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-base truncate">
                      {page.title}
                    </h3>
                    <Badge
                      variant={page.status === 'published' ? 'default' : 'secondary'}
                      className={
                        page.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      }
                    >
                      {page.status === 'published' ? 'منشور' : 'مسودة'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate" dir="ltr">
                    /{page.slug}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(page.updated_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(page)}
                    className="p-2 rounded-lg border border-gray-200 hover:border-sovereign-gold hover:text-sovereign-gold transition-colors"
                    title="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    disabled={deletingId === page.id}
                    className="p-2 rounded-lg border border-gray-200 hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="حذف"
                  >
                    {deletingId === page.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}