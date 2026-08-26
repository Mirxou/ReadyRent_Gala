'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Download } from 'lucide-react';

interface DamageAssessment {
  id: number;
  booking: {
    id: number;
    user: { email: string };
    product: { name: string; name_ar: string };
    start_date: string;
    end_date: string;
  };
  severity: 'none' | 'minor' | 'moderate' | 'severe' | 'total';
  status: 'pending' | 'reviewed' | 'disputed' | 'resolved';
  damage_description: string;
  repair_cost: number;
  replacement_cost: number;
  assessed_at: string;
  photos: Array<{ id: number; photo: string; photo_type: string }>;
  claim?: {
    id: number;
    claimed_amount: number;
    approved_amount?: number;
    status: string;
  };
}

export default function DamageAssessmentPage() {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<DamageAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/damage-assessment/');
      setAssessments(response.data.results || response.data);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل تحميل التقييمات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: DamageAssessment['status']) => {
    try {
      await api.patch(`/bookings/damage-assessment/${id}/`, { status });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة التقييم بنجاح',
      });
      loadAssessments();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل تحديث الحالة',
        variant: 'destructive',
      });
    }
  };

  const getSeverityBadge = (severity: DamageAssessment['severity']) => {
    const badges = {
      none: <Badge className="bg-green-500">لا يوجد ضرر</Badge>,
      minor: <Badge className="bg-yellow-500">ضرر بسيط</Badge>,
      moderate: <Badge className="bg-orange-500">ضرر متوسط</Badge>,
      severe: <Badge className="bg-red-500">ضرر شديد</Badge>,
      total: <Badge className="bg-red-800">خسارة كاملة</Badge>,
    };
    return badges[severity];
  };

  const getStatusBadge = (status: DamageAssessment['status']) => {
    const badges = {
      pending: <Badge variant="outline">قيد المراجعة</Badge>,
      reviewed: <Badge className="bg-blue-500">تمت المراجعة</Badge>,
      disputed: <Badge className="bg-yellow-500">قيد النزاع</Badge>,
      resolved: <Badge className="bg-green-500">تم الحل</Badge>,
    };
    return badges[status];
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.booking.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.booking.product.name_ar.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة تقييم الأضرار</h1>
          <p className="text-muted-foreground">مراجعة وإدارة تقييمات الأضرار</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فلترة البحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث بالبريد الإلكتروني أو اسم المنتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="reviewed">تمت المراجعة</option>
              <option value="disputed">قيد النزاع</option>
              <option value="resolved">تم الحل</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredAssessments.map((assessment) => (
          <Card key={assessment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>تقييم #{assessment.id}</CardTitle>
                  <CardDescription>
                    {assessment.booking.product.name_ar} - {assessment.booking.user.email}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {getSeverityBadge(assessment.severity)}
                  {getStatusBadge(assessment.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ التقييم</p>
                  <p className="font-medium">{new Date(assessment.assessed_at).toLocaleDateString('ar')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تكلفة الإصلاح</p>
                  <p className="font-medium">{assessment.repair_cost.toFixed(2)} دج</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تكلفة الاستبدال</p>
                  <p className="font-medium">{assessment.replacement_cost.toFixed(2)} دج</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد الصور</p>
                  <p className="font-medium">{assessment.photos?.length || 0}</p>
                </div>
              </div>

              {assessment.damage_description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">وصف الضرر</p>
                  <p className="text-sm">{assessment.damage_description}</p>
                </div>
              )}

              {assessment.photos && assessment.photos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">الصور</p>
                  <div className="grid grid-cols-4 gap-2">
                    {assessment.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.photo}
                        alt="Damage photo"
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}

              {assessment.claim && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">المطالبة</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">المبلغ المطالب</p>
                      <p className="font-medium">{assessment.claim.claimed_amount.toFixed(2)} دج</p>
                    </div>
                    {assessment.claim.approved_amount && (
                      <div>
                        <p className="text-sm text-muted-foreground">المبلغ المعتمد</p>
                        <p className="font-medium">{assessment.claim.approved_amount.toFixed(2)} دج</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">الحالة</p>
                      <Badge>{assessment.claim.status}</Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {assessment.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(assessment.id, 'reviewed')}
                    >
                      اعتماد المراجعة
                    </Button>
                  </>
                )}
                {assessment.status === 'reviewed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(assessment.id, 'resolved')}
                  >
                    تم الحل
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد تقييمات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


