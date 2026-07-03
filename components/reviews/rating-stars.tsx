'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRatingChange,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, index) => {
        const value = index + 1;
        const filled = value <= Math.round(rating);
        
        return (
          <Star
            key={index}
            className={cn(
              sizeClasses[size],
              filled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground',
              interactive && 'cursor-pointer hover:fill-yellow-300'
            )}
            onClick={() => handleClick(value)}
          />
        );
      })}
      {showValue && (
        <span className="text-sm font-semibold mr-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

