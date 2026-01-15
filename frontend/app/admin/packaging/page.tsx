'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packagingApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, Plus, Package, Box, Edit, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminPackagingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'types' | 'materials' | 'rules' | 'instances'>('types');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: number; [key: string]: unknown } | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const { data: types, isLoading: typesLoading } = useQuery({
    queryKey: ['packaging-types'],
    queryFn: () => packagingApi.getTypes().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') && activeTab === 'types',
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['packaging-materials'],
    queryFn: () => packagingApi.getMaterials().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') && activeTab === 'materials',
  });

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['packaging-rules'],
    queryFn: () => packagingApi.getRules().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') && activeTab === 'rules',
  });

  const { data: instances, isLoading: instancesLoading } = useQuery({
    queryKey: ['packaging-instances'],
    queryFn: () => packagingApi.getInstances().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff') && activeTab === 'instances',
  });

  const isLoading = typesLoading || materialsLoading || rulesLoading || instancesLoading;

  const createTypeMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => packagingApi.createType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-types'] });
      toast.success('تم إضافة النوع بنجاح');
      setIsCreateDialogOpen(false);
      setFormData({});
    },
    onError: () => toast.error('حدث خطأ أثناء الإضافة'),
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => packagingApi.updateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-types'] });
      toast.success('تم التحديث بنجاح');
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: () => toast.error('حدث خطأ أثناء التحديث'),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => packagingApi.deleteType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-types'] });
      toast.success('تم الحذف بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف'),
  });

  const createMaterialMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => packagingApi.createMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
      toast.success('تم إضافة المادة بنجاح');
      setIsCreateDialogOpen(false);
      setFormData({});
    },
    onError: () => toast.error('حدث خطأ أثناء الإضافة'),
  });

  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => packagingApi.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
      toast.success('تم التحديث بنجاح');
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: () => toast.error('حدث خطأ أثناء التحديث'),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (id: number) => packagingApi.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
      toast.success('تم الحذف بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف'),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => packagingApi.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-rules'] });
      toast.success('تم إضافة القاعدة بنجاح');
      setIsCreateDialogOpen(false);
      setFormData({});
    },
    onError: () => toast.error('حدث خطأ أثناء الإضافة'),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => packagingApi.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-rules'] });
      toast.success('تم التحديث بنجاح');
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: () => toast.error('حدث خطأ أثناء التحديث'),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => packagingApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-rules'] });
      toast.success('تم الحذف بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف'),
  });

  const handleCreate = () => {
    if (activeTab === 'types') createTypeMutation.mutate(formData);
    else if (activeTab === 'materials') createMaterialMutation.mutate(formData);
    else if (activeTab === 'rules') createRuleMutation.mutate(formData);
  };

  const handleEdit = (item: { id: number; [key: string]: unknown }) => {
    setEditingItem(item);
    const formDataConverted: Record<string, string | number> = {};
    Object.keys(item).forEach((key) => {
      if (key !== 'id') {
        const value = item[key];
        if (typeof value === 'string' || typeof value === 'number') {
          formDataConverted[key] = value;
        } else if (value !== null && value !== undefined) {
          formDataConverted[key] = String(value);
        }
      }
    });
    setFormData(formDataConverted);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    if (activeTab === 'types') updateTypeMutation.mutate({ id: editingItem.id, data: formData });
    else if (activeTab === 'materials') updateMaterialMutation.mutate({ id: editingItem.id, data: formData });
    else if (activeTab === 'rules') updateRuleMutation.mutate({ id: editingItem.id, data: formData });
  };

  const handleDelete = (id: number) => {
    if (activeTab === 'types') deleteTypeMutation.mutate(id);
    else if (activeTab === 'materials') deleteMaterialMutation.mutate(id);
    else if (activeTab === 'rules') deleteRuleMutation.mutate(id);
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null;
  }

  const tabs = [
    { id: 'types' as const, label: 'أنواع التغليف', icon: Package },
    { id: 'materials' as const, label: 'المواد', icon: Box },
    { id: 'rules' as const, label: 'القواعد', icon: Package },
    { id: 'instances' as const, label: 'الحالات', icon: Box },
  ];

  const renderTable = () => {
    switch (activeTab) {
      case 'types':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد أنواع تغليف</p>
                  </TableCell>
                </TableRow>
              ) : (
                types?.results?.map((type: { id: number; name?: string; description?: string; is_active?: boolean }) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name || '-'}</TableCell>
                    <TableCell>{type.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? 'default' : 'secondary'}>
                        {type.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(type)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا النوع؟')) {
                              handleDelete(type.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      case 'materials':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الكمية المتاحة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد مواد تغليف</p>
                  </TableCell>
                </TableRow>
              ) : (
                materials?.results?.map((material: { id: number; name?: string; material_type?: string; quantity_available?: number; is_available?: boolean }) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name || '-'}</TableCell>
                    <TableCell>{material.material_type || '-'}</TableCell>
                    <TableCell>{material.quantity_available || 0}</TableCell>
                    <TableCell>
                      <Badge variant={material.is_available ? 'default' : 'secondary'}>
                        {material.is_available ? 'متوفر' : 'غير متوفر'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه المادة؟')) {
                              handleDelete(material.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      case 'rules':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>نوع المنتج</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد قواعد تغليف</p>
                  </TableCell>
                </TableRow>
              ) : (
                rules?.results?.map((rule: { id: number; name?: string; product_type?: string; priority?: number; is_active?: boolean }) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name || '-'}</TableCell>
                    <TableCell>{rule.product_type || '-'}</TableCell>
                    <TableCell>{rule.priority || 0}</TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
                              handleDelete(rule.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      case 'instances':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>نوع التغليف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد حالات تغليف</p>
                  </TableCell>
                </TableRow>
              ) : (
                instances?.results?.map((instance: { id: number; product_name?: string; packaging_type_name?: string; status?: string; created_at?: string }) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">
                      {instance.product_name || 'منتج غير معروف'}
                    </TableCell>
                    <TableCell>{instance.packaging_type_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={instance.status === 'used' ? 'default' : 'secondary'}>
                        {instance.status === 'used' ? 'مستخدم' : 'متاح'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {instance.created_at
                        ? new Date(instance.created_at).toLocaleDateString('ar-EG')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة التغليف</h1>
        <p className="text-muted-foreground">عرض وإدارة أنواع التغليف والمواد والقواعد</p>
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 border-b pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{tabs.find((t) => t.id === activeTab)?.label}</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setFormData({})}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة جديد
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      إضافة {activeTab === 'types' ? 'نوع تغليف' : activeTab === 'materials' ? 'مادة' : 'قاعدة'} جديد
                    </DialogTitle>
                    <DialogDescription>
                      أدخل المعلومات المطلوبة
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {activeTab === 'types' && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="name">الاسم</Label>
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="اسم نوع التغليف"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">الوصف</Label>
                          <Input
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="الوصف"
                          />
                        </div>
                      </>
                    )}
                    {activeTab === 'materials' && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="name">الاسم</Label>
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="اسم المادة"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="material_type">نوع المادة</Label>
                          <Input
                            id="material_type"
                            value={formData.material_type || ''}
                            onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                            placeholder="نوع المادة"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="quantity_available">الكمية المتاحة</Label>
                          <Input
                            id="quantity_available"
                            type="number"
                            value={formData.quantity_available || 0}
                            onChange={(e) => setFormData({ ...formData, quantity_available: Number(e.target.value) })}
                            placeholder="الكمية"
                          />
                        </div>
                      </>
                    )}
                    {activeTab === 'rules' && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="name">الاسم</Label>
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="اسم القاعدة"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="product_type">نوع المنتج</Label>
                          <Input
                            id="product_type"
                            value={formData.product_type || ''}
                            onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                            placeholder="نوع المنتج"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="priority">الأولوية</Label>
                          <Input
                            id="priority"
                            type="number"
                            value={formData.priority || 0}
                            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                            placeholder="الأولوية"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        createTypeMutation.isPending ||
                        createMaterialMutation.isPending ||
                        createRuleMutation.isPending
                      }
                    >
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>{renderTable()}</CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              تعديل {activeTab === 'types' ? 'نوع التغليف' : activeTab === 'materials' ? 'المادة' : 'القاعدة'}
            </DialogTitle>
            <DialogDescription>قم بتعديل المعلومات</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {activeTab === 'types' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">الاسم</Label>
                  <Input
                    id="edit-name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">الوصف</Label>
                  <Input
                    id="edit-description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </>
            )}
            {activeTab === 'materials' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">الاسم</Label>
                  <Input
                    id="edit-name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-material_type">نوع المادة</Label>
                  <Input
                    id="edit-material_type"
                    value={formData.material_type || ''}
                    onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-quantity_available">الكمية المتاحة</Label>
                  <Input
                    id="edit-quantity_available"
                    type="number"
                    value={formData.quantity_available || 0}
                    onChange={(e) => setFormData({ ...formData, quantity_available: Number(e.target.value) })}
                  />
                </div>
              </>
            )}
            {activeTab === 'rules' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">الاسم</Label>
                  <Input
                    id="edit-name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-product_type">نوع المنتج</Label>
                  <Input
                    id="edit-product_type"
                    value={formData.product_type || ''}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">الأولوية</Label>
                  <Input
                    id="edit-priority"
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                updateTypeMutation.isPending ||
                updateMaterialMutation.isPending ||
                updateRuleMutation.isPending
              }
            >
              تحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

