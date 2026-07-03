'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface DisputeFormProps {
  bookingId?: number;
  onComplete?: () => void;
}

export function DisputeForm({ bookingId, onComplete }: DisputeFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    booking_id: bookingId || undefined,
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال العنوان والوصف',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/disputes/disputes/create/', formData);
      toast({
        title: 'تم الإرسال',
        description: 'تم إنشاء النزاع بنجاح',
      });
      if (onComplete) onComplete();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.response?.data?.error || 'فشل إنشاء النزاع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء نزاع</CardTitle>
        <CardDescription>أبلغ عن مشكلة أو نزاع متعلق بالحجز</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">العنوان</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="عنوان النزاع"
          />
        </div>

        <div>
          <Label htmlFor="description">الوصف</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            placeholder="وصف مفصل للنزاع..."
          />
        </div>

        <div>
          <Label htmlFor="priority">الأولوية</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as typeof formData.priority })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">منخفضة</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="urgent">عاجلة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? 'جاري الإرسال...' : 'إرسال النزاع'}
        </Button>
      </CardContent>
    </Card>
  );
}


