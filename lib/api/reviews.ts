import { sovereignClient } from './sovereign-client';
import type { TrustTier } from '@/lib/trust-score';

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewer_name: string;
  product_id: string;
  rating: number; // 1-5
  comment: string;
  is_verified: boolean;
  created_at: string;
}

export interface TrustScore {
  overall_score: number;
  is_verified: boolean;
  vouch_count: number;
  review_count: number;
  avg_rating: number;
  components: {
    verification: number;
    rating: number;
    vouches: number;
  };
  tier: TrustTier;
  tier_label: string;
}

export const reviewsApi = {
  /** List reviews for a product */
  listForProduct: (productId: string, params?: { page?: number }) => {
    const q = new URLSearchParams({ product_id: productId });
    if (params?.page) q.append('page', params.page.toString());
    return sovereignClient.get<Review[]>(`/reviews?${q.toString()}`);
  },

  /** List reviews — used by /products/[id] page */
  getAll: (params?: Record<string, unknown>) => {
    const q = new URLSearchParams();
    if (params?.product_id) q.append('product_id', String(params.product_id));
    if (params?.page) q.append('page', String(params.page));
    return sovereignClient.get<Review[]>(`/reviews?${q.toString()}`);
  },

  /** Get reviews given by or received by the current user */
  listMyReviews: () =>
    sovereignClient.get<Review[]>('/reviews?my=true'),

  /** Submit a review — used by review-form.tsx */
  create: (data: {
    product_id?: string;
    booking_id?: string;
    rating: number;
    title?: string;
    comment: string;
  }) => sovereignClient.post<Review>('/reviews/create', data),

  /** Submit a review for a completed booking (alias) */
  createReview: (data: {
    booking_id: string;
    rating: number;
    comment: string;
  }) => sovereignClient.post<Review>('/reviews/create', data),

  /** Get the trust score for the current user */
  getMyTrustScore: () =>
    sovereignClient.get<TrustScore>('/social/score/me'),

  /** Get the trust score for a specific user (public) */
  getUserTrustScore: (userId: string) =>
    sovereignClient.get<TrustScore>(`/social/score/${userId}`),
};
