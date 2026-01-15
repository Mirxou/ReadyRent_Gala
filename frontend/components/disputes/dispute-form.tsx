'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { disputesApi } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DisputeFormProps {
  bookingId?: number;
  onSuccess?: () => void;
}

export function DisputeForm({ bookingId, onSuccess }: DisputeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dispute_type: '',
    subject: '',
    description: '',
    booking_id: bookingId || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await disputesApi.createDispute(formData);
      toast.success('تم إنشاء النزاع بنجاح');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/disputes');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إنشاء النزاع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء نزاع جديد</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="dispute_type">نوع النزاع</Label>
            <Select
              value={formData.dispute_type}
              onValueChange={(value) => setFormData({ ...formData, dispute_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع النزاع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="damage">ضرر في المنتج</SelectItem>
                <SelectItem value="refund">استرداد</SelectItem>
                <SelectItem value="delivery">مشكلة في التوصيل</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">الموضوع</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="موضوع النزاع"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف تفصيلي للنزاع"
              rows={5}
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'جاري الإرسال...' : 'إنشاء النزاع'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

