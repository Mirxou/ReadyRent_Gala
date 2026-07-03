import { sovereignClient } from './sovereign-client';

export interface Review {
  id: number;
  booking_id: number;
  reviewer_id: number;
  reviewer_name: string;
  product_id: number;
  rating: number; // 1-5
  comment: string;
  is_verified: boolean;
  created_at: string;
}

export interface TrustScore {
  overall_score: number; // 0-100
  components: {
    payment_reliability: number;
    dispute_history: number;
    contract_compliance: number;
    review_sentiment: number;
    identity_verification: number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'sovereign';
  last_calculated: string;
}

export const reviewsApi = {
  /** List reviews for a product */
  listForProduct: (productId: number, params?: { page?: number }) => {
    const q = new URLSearchParams({ product_id: productId.toString() });
    if (params?.page) q.append('page', params.page.toString());
    return sovereignClient.get<Review[]>(`/reviews/reviews/?${q.toString()}`);
  },

  /** Get reviews given by or received by the current user */
  listMyReviews: () =>
    sovereignClient.get<Review[]>('/reviews/reviews/my_reviews/'),

  /** Submit a review for a completed booking */
  createReview: (data: {
    booking_id: number;
    rating: number;
    comment: string;
  }) => sovereignClient.post<Review>('/reviews/reviews/', data),

  /** Get the trust score for the current user */
  getMyTrustScore: () =>
    sovereignClient.get<TrustScore>('/reviews/trust-score/my/'),

  /** Get the trust score for a specific user (public) */
  getUserTrustScore: (userId: number) =>
    sovereignClient.get<TrustScore>(`/reviews/trust-score/${userId}/`),
};
