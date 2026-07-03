'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Edit, Trash2, Users, Package } from 'lucide-react';

interface Branch {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  staff_count: number;
  product_count: number;
}

export default function BranchesPage() {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    code: '',
    address: '',
    city: 'Constantine',
    postal_code: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    is_active: true,
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches/admin/branches/');
      setBranches(response.data.results || response.data);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل تحميل الفروع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name_ar || !formData.code || !formData.address) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      const submitData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (editingBranch) {
        await api.patch(`/branches/admin/branches/${editingBranch.id}/`, submitData);
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الفرع بنجاح',
        });
      } else {
        await api.post('/branches/admin/branches/', submitData);
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة الفرع بنجاح',
        });
      }
      setShowForm(false);
      setEditingBranch(null);
      setFormData({
        name: '',
        name_ar: '',
        code: '',
        address: '',
        city: 'Constantine',
        postal_code: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        is_active: true,
      });
      loadBranches();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل حفظ الفرع',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      name_ar: branch.name_ar,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      postal_code: '',
      latitude: branch.latitude?.toString() || '',
      longitude: branch.longitude?.toString() || '',
      phone: branch.phone,
      email: branch.email || '',
      is_active: branch.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (branchId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;

    try {
      await api.delete(`/branches/admin/branches/${branchId}/`);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الفرع بنجاح',
      });
      loadBranches();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل حذف الفرع',
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
          <h1 className="text-3xl font-bold">إدارة الفروع</h1>
          <p className="text-muted-foreground">إدارة الفروع والمواقع</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingBranch(null); }}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة فرع جديد
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_ar">الاسم (عربي)</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="اسم الفرع بالعربية"
                />
              </div>
              <div>
                <Label htmlFor="code">رمز الفرع</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="BR001"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="العنوان الكامل"
                />
              </div>
              <div>
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="latitude">خط العرض</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="36.3650"
                />
              </div>
              <div>
                <Label htmlFor="longitude">خط الطول</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="6.6147"
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
                {editingBranch ? 'تحديث' : 'إضافة'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingBranch(null); }}>
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{branch.name_ar}</CardTitle>
                  <CardDescription>
                    {branch.code} - {branch.city}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {branch.is_active && <Badge className="bg-green-500">نشط</Badge>}
                  <Button variant="outline" size="sm" onClick={() => handleEdit(branch)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(branch.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{branch.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium">{branch.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المنتجات</p>
                  <p className="font-medium flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {branch.product_count}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الموظفون</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {branch.staff_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {branches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد فروع</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


