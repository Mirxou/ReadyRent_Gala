'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, Plus, Package, AlertTriangle, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
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

export default function AdminInventoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
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

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', filterType],
    queryFn: () => inventoryApi.getItems().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
  });

  const { data: stockAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => inventoryApi.getStockAlerts().then((res) => res.data),
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'staff'),
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    product: '',
    sku: '',
    quantity: 0,
    low_stock_threshold: 0,
    location: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('تم إضافة العنصر بنجاح');
      setIsCreateDialogOpen(false);
      setFormData({ product: '', sku: '', quantity: 0, low_stock_threshold: 0, location: '' });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة العنصر');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => inventoryApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('تم تحديث العنصر بنجاح');
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث العنصر');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast.success('تم حذف العنصر بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف العنصر');
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      product: item.product?.toString() || '',
      sku: item.sku || '',
      quantity: item.quantity || 0,
      low_stock_threshold: item.low_stock_threshold || 0,
      location: item.location || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    }
  };

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
    return null;
  }

  const filteredItems = items?.results?.filter((item: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        item.product_name?.toLowerCase().includes(searchLower) ||
        item.sku?.toLowerCase().includes(searchLower)
      );
    }
    if (filterType === 'low_stock') {
      return item.quantity <= item.low_stock_threshold && item.quantity > 0;
    }
    if (filterType === 'out_of_stock') {
      return item.quantity === 0;
    }
    return true;
  }) || items?.results || [];

  const getStockStatus = (item: any) => {
    if (item.quantity === 0) {
      return { label: 'نفد المخزون', variant: 'destructive' as const };
    }
    if (item.quantity <= item.low_stock_threshold) {
      return { label: 'مخزون منخفض', variant: 'default' as const };
    }
    return { label: 'متوفر', variant: 'secondary' as const };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة المخزون</h1>
        <p className="text-muted-foreground">عرض وإدارة عناصر المخزون والتنبيهات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العناصر</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items?.results?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات المخزون</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stockAlerts?.results?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نفد المخزون</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {filteredItems.filter((item: any) => item.quantity === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المخزون..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                الكل
              </Button>
              <Button
                variant={filterType === 'low_stock' ? 'default' : 'outline'}
                onClick={() => setFilterType('low_stock')}
              >
                مخزون منخفض
              </Button>
              <Button
                variant={filterType === 'out_of_stock' ? 'default' : 'outline'}
                onClick={() => setFilterType('out_of_stock')}
              >
                نفد المخزون
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      {stockAlerts?.results && stockAlerts.results.length > 0 && (
        <Card className="mb-6 border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              تنبيهات المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stockAlerts.results.slice(0, 5).map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{alert.product_name || 'منتج'}</p>
                    <p className="text-sm text-muted-foreground">
                      الكمية الحالية: {alert.current_quantity} | الحد الأدنى: {alert.threshold}
                    </p>
                  </div>
                  <Badge variant="destructive">تحذير</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">جاري تحميل المخزون...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>عناصر المخزون</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة عنصر
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة عنصر جديد للمخزون</DialogTitle>
                    <DialogDescription>
                      أدخل معلومات العنصر الجديد
                    </DialogDescription>
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
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="رمز SKU"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">الكمية</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        placeholder="الكمية"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="threshold">الحد الأدنى للمخزون</Label>
                      <Input
                        id="threshold"
                        type="number"
                        value={formData.low_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                        placeholder="الحد الأدنى"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">الموقع</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="موقع التخزين"
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
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الحد الأدنى</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">لا توجد عناصر في المخزون</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: any) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product_name || 'منتج غير معروف'}
                        </TableCell>
                        <TableCell>{item.sku || '-'}</TableCell>
                        <TableCell>
                          <span className={item.quantity === 0 ? 'text-red-500 font-bold' : ''}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{item.low_stock_threshold || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{item.location || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل عنصر المخزون</DialogTitle>
            <DialogDescription>
              قم بتعديل معلومات العنصر
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-product">المنتج (ID)</Label>
              <Input
                id="edit-product"
                type="number"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="معرف المنتج"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="رمز SKU"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-quantity">الكمية</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                placeholder="الكمية"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-threshold">الحد الأدنى للمخزون</Label>
              <Input
                id="edit-threshold"
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                placeholder="الحد الأدنى"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">الموقع</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="موقع التخزين"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

