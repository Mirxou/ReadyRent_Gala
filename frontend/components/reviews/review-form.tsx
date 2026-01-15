'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from './rating-stars';
import { reviewsApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ReviewFormProps {
  productId: number;
  bookingId?: number;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, bookingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: (data: any) => reviewsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('تم إضافة التقييم بنجاح');
      setRating(5);
      setTitle('');
      setComment('');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'حدث خطأ أثناء إضافة التقييم');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !comment.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    createReviewMutation.mutate({
      product_id: productId,
      booking_id: bookingId,
      rating,
      title,
      comment,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>التقييم</Label>
        <RatingStars
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
      </div>

      <div>
        <Label htmlFor="title">عنوان التقييم</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="اكتب عنواناً للتقييم"
          required
        />
      </div>

      <div>
        <Label htmlFor="comment">التعليق</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="شاركنا تجربتك..."
          rows={4}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={createReviewMutation.isPending}
        className="w-full"
      >
        {createReviewMutation.isPending ? 'جاري الإضافة...' : 'إضافة التقييم'}
      </Button>
    </form>
  );
}

