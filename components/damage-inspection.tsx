'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Camera, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface DamageAssessment {
  id: number;
  booking: number;
  severity: 'none' | 'minor' | 'moderate' | 'severe' | 'total';
  status: 'pending' | 'reviewed' | 'disputed' | 'resolved';
  damage_description: string;
  repair_cost: number;
  replacement_cost: number;
  photos: DamagePhoto[];
  checklist_items: InspectionItem[];
  claim?: DamageClaim;
}

interface DamagePhoto {
  id: number;
  photo: string;
  photo_type: 'pre_rental' | 'post_rental' | 'damage' | 'repair';
  description: string;
  uploaded_at: string;
}

interface InspectionItem {
  id: number;
  item_name: string;
  item_description: string;
  is_checked: boolean;
  condition: string;
  notes: string;
}

interface DamageClaim {
  id: number;
  claimed_amount: number;
  approved_amount?: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid';
  claim_description: string;
}

interface DamageInspectionProps {
  bookingId: number;
  onComplete?: () => void;
}

export function DamageInspection({ bookingId, onComplete }: DamageInspectionProps) {
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<DamageAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    severity: 'none' as DamageAssessment['severity'],
    damage_description: '',
    repair_cost: 0,
    replacement_cost: 0,
    notes: '',
  });
  const [selectedPhotoType, setSelectedPhotoType] = useState<DamagePhoto['photo_type']>('damage');
  const [photoDescription, setPhotoDescription] = useState('');

  useEffect(() => {
    loadAssessment();
  }, [bookingId]);

  const loadAssessment = async () => {
    try {
      const response = await api.get(`/bookings/damage-assessment/`);
      const assessments = response.data.results || response.data;
      const bookingAssessment = assessments.find((a: DamageAssessment) => a.booking === bookingId);
      if (bookingAssessment) {
        setAssessment(bookingAssessment);
        setFormData({
          severity: bookingAssessment.severity,
          damage_description: bookingAssessment.damage_description || '',
          repair_cost: bookingAssessment.repair_cost || 0,
          replacement_cost: bookingAssessment.replacement_cost || 0,
          notes: bookingAssessment.notes || '',
        });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading assessment:', error);
      }
    }
  };

  const createAssessment = async () => {
    setLoading(true);
    try {
      const response = await api.post('/bookings/damage-assessment/', {
        booking_id: bookingId,
        ...formData,
      });
      setAssessment(response.data);
      toast({
        title: 'تم إنشاء التقييم',
        description: 'تم إنشاء تقييم الأضرار بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل إنشاء التقييم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAssessment = async () => {
    if (!assessment) return;
    setLoading(true);
    try {
      const response = await api.patch(`/bookings/damage-assessment/${assessment.id}/`, formData);
      setAssessment(response.data);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث التقييم بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل تحديث التقييم',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assessment) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('assessment_id', assessment.id.toString());
    formData.append('photo_type', selectedPhotoType);
    formData.append('description', photoDescription);

    try {
      await api.post('/bookings/damage-photos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({
        title: 'تم رفع الصورة',
        description: 'تم رفع الصورة بنجاح',
      });
      loadAssessment();
      setPhotoDescription('');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل رفع الصورة',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) {
      await createAssessment();
    } else {
      await updateAssessment();
    }
    if (onComplete) onComplete();
  };

  const getSeverityColor = (severity: DamageAssessment['severity']) => {
    const colors = {
      none: 'text-green-600',
      minor: 'text-yellow-600',
      moderate: 'text-orange-600',
      severe: 'text-red-600',
      total: 'text-red-800',
    };
    return colors[severity];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تقييم الأضرار</CardTitle>
          <CardDescription>توثيق حالة المنتج قبل وبعد الكراء</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severity">شدة الضرر</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value as DamageAssessment['severity'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">لا يوجد ضرر</SelectItem>
                  <SelectItem value="minor">ضرر بسيط</SelectItem>
                  <SelectItem value="moderate">ضرر متوسط</SelectItem>
                  <SelectItem value="severe">ضرر شديد</SelectItem>
                  <SelectItem value="total">خسارة كاملة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="repair_cost">تكلفة الإصلاح (دج)</Label>
              <Input
                id="repair_cost"
                type="number"
                value={formData.repair_cost}
                onChange={(e) => setFormData({ ...formData, repair_cost: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="replacement_cost">تكلفة الاستبدال (دج)</Label>
              <Input
                id="replacement_cost"
                type="number"
                value={formData.replacement_cost}
                onChange={(e) => setFormData({ ...formData, replacement_cost: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="damage_description">وصف الضرر</Label>
            <Textarea
              id="damage_description"
              value={formData.damage_description}
              onChange={(e) => setFormData({ ...formData, damage_description: e.target.value })}
              rows={4}
              placeholder="وصف مفصل للضرر..."
            />
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {assessment && (
            <div className="space-y-4">
              <div>
                <Label>رفع صور</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={selectedPhotoType} onValueChange={(value) => setSelectedPhotoType(value as DamagePhoto['photo_type'])}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre_rental">قبل الكراء</SelectItem>
                      <SelectItem value="post_rental">بعد الكراء</SelectItem>
                      <SelectItem value="damage">تفاصيل الضرر</SelectItem>
                      <SelectItem value="repair">توثيق الإصلاح</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    placeholder="وصف الصورة"
                    value={photoDescription}
                    onChange={(e) => setPhotoDescription(e.target.value)}
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" disabled={uploading} asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {assessment.photos && assessment.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {assessment.photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={photo.photo}
                        alt={photo.description}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                        {photo.description || photo.photo_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button onClick={handleSubmit} disabled={loading}>
              {assessment ? 'تحديث التقييم' : 'إنشاء التقييم'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {assessment && (
        <Card>
          <CardHeader>
            <CardTitle>حالة التقييم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>الشدة:</span>
                <span className={getSeverityColor(assessment.severity)}>
                  {assessment.severity === 'none' && 'لا يوجد ضرر'}
                  {assessment.severity === 'minor' && 'ضرر بسيط'}
                  {assessment.severity === 'moderate' && 'ضرر متوسط'}
                  {assessment.severity === 'severe' && 'ضرر شديد'}
                  {assessment.severity === 'total' && 'خسارة كاملة'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>الحالة:</span>
                <span>{assessment.status}</span>
              </div>
              {assessment.repair_cost > 0 && (
                <div className="flex items-center justify-between">
                  <span>تكلفة الإصلاح:</span>
                  <span>{assessment.repair_cost.toFixed(2)} دج</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


