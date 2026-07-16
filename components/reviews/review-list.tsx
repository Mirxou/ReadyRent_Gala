'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from './rating-stars';
import { CheckCircle } from 'lucide-react';

interface ReviewUser {
  id: string;
  username: string;
}

interface Review {
  id: number;
  user_id: string;
  booking_id: number | null;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  status: string;
  created_at: string;
  user: ReviewUser | null;
}

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
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
                  <p className="font-semibold">{review.user?.username || review.reviewer_name}</p>
                  <RatingStars rating={review.rating} size="sm" showValue />
                </div>
                {review.is_verified && (
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

            {review.comment && (
              <p className="text-muted-foreground mb-4">{review.comment}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}