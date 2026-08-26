'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface IDUploadProps {
  onComplete?: () => void;
}

export function IDUpload({ onComplete }: IDUploadProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id_type: 'national_id' as 'national_id' | 'passport' | 'driver_license',
    id_number: '',
    id_front_image: null as File | null,
    id_back_image: null as File | null,
  });

  const handleFileChange = (field: 'id_front_image' | 'id_back_image', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleSubmit = async () => {
    if (!formData.id_number) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رقم الهوية',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.id_front_image || !formData.id_back_image) {
      toast({
        title: 'خطأ',
        description: 'يرجى رفع صور الهوية الأمامية والخلفية',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('id_type', formData.id_type);
      uploadData.append('id_number', formData.id_number);
      uploadData.append('id_front_image', formData.id_front_image);
      uploadData.append('id_back_image', formData.id_back_image);

      await api.patch('/users/verification/id/upload/', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'تم الرفع',
        description: 'تم رفع صور الهوية بنجاح',
      });

      if (onComplete) onComplete();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل رفع الصور',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>رفع الهوية</CardTitle>
        <CardDescription>قم برفع صور الهوية الوطنية أو جواز السفر للتحقق</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="id_type">نوع الهوية</Label>
          <Select
            value={formData.id_type}
            onValueChange={(value) => setFormData({ ...formData, id_type: value as typeof formData.id_type })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national_id">الهوية الوطنية</SelectItem>
              <SelectItem value="passport">جواز السفر</SelectItem>
              <SelectItem value="driver_license">رخصة القيادة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="id_number">رقم الهوية</Label>
          <Input
            id="id_number"
            value={formData.id_number}
            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
            placeholder="أدخل رقم الهوية"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="id_front">الصورة الأمامية</Label>
            <div className="mt-2">
              <label className="cursor-pointer">
                <Input
                  id="id_front"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('id_front_image', e)}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {formData.id_front_image ? formData.id_front_image.name : 'رفع الصورة الأمامية'}
                  </span>
                </Button>
              </label>
              {formData.id_front_image && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(formData.id_front_image)}
                    alt="Front ID"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="id_back">الصورة الخلفية</Label>
            <div className="mt-2">
              <label className="cursor-pointer">
                <Input
                  id="id_back"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('id_back_image', e)}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {formData.id_back_image ? formData.id_back_image.name : 'رفع الصورة الخلفية'}
                  </span>
                </Button>
              </label>
              {formData.id_back_image && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(formData.id_back_image)}
                    alt="Back ID"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? 'جاري الرفع...' : 'رفع الهوية'}
        </Button>
      </CardContent>
    </Card>
  );
}


