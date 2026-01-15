'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Page {
  id: number;
  title: string;
  title_ar: string;
  slug: string;
  page_type: string;
  content: string;
  content_ar: string;
  status: string;
  is_featured: boolean;
  order: number;
}

const PAGE_TYPES: Record<string, string> = {
  about: 'من نحن',
  terms: 'شروط الخدمة',
  privacy: 'سياسة الخصوصية',
  contact: 'اتصل بنا',
  faq: 'الأسئلة الشائعة',
  custom: 'صفحة مخصصة',
};

const STATUS_CHOICES: Record<string, string> = {
  draft: 'مسودة',
  published: 'منشور',
  archived: 'مؤرشف',
};

export default function CMSPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    slug: '',
    page_type: 'custom',
    content: '',
    content_ar: '',
    status: 'draft',
    is_featured: false,
    order: 0,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/cms/pages/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPages(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = () => {
    setSelectedPage(null);
    setFormData({
      title: '',
      title_ar: '',
      slug: '',
      page_type: 'custom',
      content: '',
      content_ar: '',
      status: 'draft',
      is_featured: false,
      order: 0,
    });
    setOpen(true);
  };

  const handleEditPage = (page: Page) => {
    setSelectedPage(page);
    setFormData({
      title: page.title,
      title_ar: page.title_ar,
      slug: page.slug,
      page_type: page.page_type,
      content: page.content,
      content_ar: page.content_ar,
      status: page.status,
      is_featured: page.is_featured,
      order: page.order,
    });
    setOpen(true);
  };

  const handleSavePage = async () => {
    if (!formData.title || !formData.title_ar || !formData.slug) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = selectedPage ? `/api/cms/pages/${selectedPage.id}/` : '/api/cms/pages/';
      const method = selectedPage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpen(false);
        fetchPages();
      } else {
        const error = await response.json();
        alert(error.detail || 'حدث خطأ أثناء حفظ الصفحة');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert('حدث خطأ أثناء حفظ الصفحة');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة الصفحات</h1>
          <p className="text-gray-600">إدارة الصفحات الثابتة (من نحن، الشروط، الخصوصية، إلخ)</p>
        </div>
        <Button onClick={handleCreatePage}>إضافة صفحة جديدة</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>مميز</TableHead>
                <TableHead>الترتيب</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    لا توجد صفحات
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>{page.title_ar || page.title}</TableCell>
                    <TableCell>{PAGE_TYPES[page.page_type] || page.page_type}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          page.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : page.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_CHOICES[page.status] || page.status}
                      </span>
                    </TableCell>
                    <TableCell>{page.is_featured ? '✓' : '-'}</TableCell>
                    <TableCell>{page.order}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEditPage(page)}>
                        تعديل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPage ? 'تعديل الصفحة' : 'إضافة صفحة جديدة'}</DialogTitle>
            <DialogDescription>إنشاء أو تعديل صفحة ثابتة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">العنوان (إنجليزي)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="title_ar">العنوان (عربي)</Label>
                <Input
                  id="title_ar"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slug">الرابط (Slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="page_type">نوع الصفحة</Label>
                <Select
                  value={formData.page_type}
                  onValueChange={(value) => setFormData({ ...formData, page_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAGE_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="content">المحتوى (إنجليزي)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>
            <div>
              <Label htmlFor="content_ar">المحتوى (عربي)</Label>
              <Textarea
                id="content_ar"
                value={formData.content_ar}
                onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                rows={8}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CHOICES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="order">الترتيب</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <Label htmlFor="is_featured">صفحة مميزة</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSavePage}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

