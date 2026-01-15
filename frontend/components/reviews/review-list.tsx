'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from './rating-stars';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface Review {
  id: number;
  user_email: string;
  user_username: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  images?: Array<{ id: number; image: string; alt_text: string }>;
  created_at: string;
}

interface ReviewListProps {
  reviews: Review[];
  productId?: number;
}

export function ReviewList({ reviews, productId }: ReviewListProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد تقييمات بعد
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div>
                  <p className="font-semibold">{review.user_username || review.user_email}</p>
                  <RatingStars rating={review.rating} size="sm" showValue />
                </div>
                {review.is_verified_purchase && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    شراء موثق
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString('ar-EG')}
              </span>
            </div>

            <h4 className="font-semibold mb-2">{review.title}</h4>
            <p className="text-muted-foreground mb-4">{review.comment}</p>

            {review.images && review.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {review.images.map((image) => (
                  <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={image.image}
                      alt={image.alt_text || 'Review image'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {review.helpful_count > 0 && (
              <p className="text-xs text-muted-foreground">
                {review.helpful_count} شخص وجد هذا مفيداً
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

