'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hygieneApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function AdminHygienePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState({
    product: '',
    cleaning_type: '',
    status: 'pending',
    cleaning_notes: '',
  });

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const { data: records, isLoading } = useQuery({
    queryKey: ['hygiene-records'],
    queryFn: () => hygieneApi.getRecords().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => hygieneApi.createHygieneRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hygiene-records'] });
      toast.success('تم إضافة السجل بنجاح');
      setIsCreateDialogOpen(false);
      setFormData({ product: '', cleaning_type: '', status: 'pending', cleaning_notes: '' });
    },
    onError: () => toast.error('حدث خطأ أثناء الإضافة'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hygieneApi.updateHygieneRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hygiene-records'] });
      toast.success('تم التحديث بنجاح');
      setIsEditDialogOpen(false);
      setEditingRecord(null);
    },
    onError: () => toast.error('حدث خطأ أثناء التحديث'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => hygieneApi.deleteHygieneRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hygiene-records'] });
      toast.success('تم الحذف بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف'),
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      product: record.product?.toString() || '',
      cleaning_type: record.cleaning_type || '',
      status: record.status || 'pending',
      cleaning_notes: record.cleaning_notes || '',
    });
    setIsEditDialogOpen(true);
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل سجلات التعقيم...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'قيد الانتظار', variant: 'outline' },
      in_progress: { label: 'قيد التنفيذ', variant: 'default' },
      completed: { label: 'مكتمل', variant: 'secondary' },
      verified: { label: 'تم التحقق', variant: 'default' },
      failed: { label: 'فشل الفحص', variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة التعقيم</h1>
          <p className="text-muted-foreground">عرض وإدارة سجلات التعقيم والتنظيف</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إضافة سجل
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة سجل تعقيم جديد</DialogTitle>
              <DialogDescription>أدخل معلومات السجل الجديد</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product">المنتج (ID)</Label>
                <Input
                  id="product"
                  type="number"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  placeholder="معرف المنتج"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cleaning_type">نوع التنظيف</Label>
                <Input
                  id="cleaning_type"
                  value={formData.cleaning_type}
                  onChange={(e) => setFormData({ ...formData, cleaning_type: e.target.value })}
                  placeholder="نوع التنظيف"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
                  <option value="verified">تم التحقق</option>
                  <option value="failed">فشل الفحص</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cleaning_notes">ملاحظات التنظيف</Label>
                <Input
                  id="cleaning_notes"
                  value={formData.cleaning_notes}
                  onChange={(e) => setFormData({ ...formData, cleaning_notes: e.target.value })}
                  placeholder="ملاحظات"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!records || records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد سجلات تعقيم</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {records.results?.map((record: any) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{record.product?.name_ar || 'منتج'}</CardTitle>
                  {getStatusBadge(record.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">نوع التنظيف</p>
                    <p className="font-semibold">{record.cleaning_type}</p>
                  </div>
                  {record.completed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ الإكمال</p>
                      <p className="font-semibold">
                        {new Date(record.completed_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  )}
                  {record.passed_inspection && (
                    <div className="col-span-2">
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        تم التحقق بنجاح
                      </Badge>
                    </div>
                  )}
                </div>
                {record.cleaning_notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{record.cleaning_notes}</p>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                    <Edit className="h-4 w-4 mr-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
                        deleteMutation.mutate(record.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل سجل التعقيم</DialogTitle>
            <DialogDescription>قم بتعديل معلومات السجل</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-product">المنتج (ID)</Label>
              <Input
                id="edit-product"
                type="number"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cleaning_type">نوع التنظيف</Label>
              <Input
                id="edit-cleaning_type"
                value={formData.cleaning_type}
                onChange={(e) => setFormData({ ...formData, cleaning_type: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">الحالة</Label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pending">قيد الانتظار</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
                <option value="verified">تم التحقق</option>
                <option value="failed">فشل الفحص</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cleaning_notes">ملاحظات التنظيف</Label>
              <Input
                id="edit-cleaning_notes"
                value={formData.cleaning_notes}
                onChange={(e) => setFormData({ ...formData, cleaning_notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (editingRecord) {
                  updateMutation.mutate({ id: editingRecord.id, data: formData });
                }
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

