import { sovereignClient } from './sovereign-client';

export interface BookingCreateData {
  product_id: string;
  start_date: string;
  end_date: string;
  has_insurance: boolean;
  extra_services: string[];
}

export interface Booking {
  id: string;
  product_id: string | null;
  product_name: string | null;
  start_date: string | null;
  end_date: string | null;
  total_price: number;
  status: string;
  escrow_status: string;
  created_at?: string;
}

export const bookingsApi = {
  create: (data: BookingCreateData) => 
    sovereignClient.post<Booking>('/bookings/create/', data),

  list: (params?: Record<string, unknown>) => 
    sovereignClient.get<Booking[]>('/bookings/', { params }),

  getAll: (params?: Record<string, unknown>) => 
    sovereignClient.get<Booking[]>('/bookings/', { params }),

  getDetail: (id: string) => 
    sovereignClient.get<Booking>(`/bookings/${id}/`),

  update: (id: string, data: Record<string, unknown>) => 
    sovereignClient.patch<Booking>(`/bookings/${id}`, data),

  /** Alias used by dashboard/orders — updates a single status field */
  updateStatus: (id: string, status: string) => 
    sovereignClient.patch<Booking>(`/bookings/${id}/`, { status }),

  cancel: (id: string) => 
    sovereignClient.post<void>(`/bookings/${id}/cancel`),

  calculateDeposit: (productId: string) => 
    sovereignClient.get<{ deposit_amount: number }>('/bookings/calculate-deposit/', { 
      params: new URLSearchParams({ product_id: productId }) 
    }),

  // Cart
  getCart: () => sovereignClient.get<unknown>('/bookings/cart/'),
  
  addToCart: (data: { product_id: string; start_date: string; end_date: string }) => 
    sovereignClient.post<unknown>('/bookings/cart/items/', data),
  
  removeFromCart: (itemId: string) => 
    sovereignClient.delete<void>(`/bookings/cart/items/${itemId}/`),

  // Waitlist — WL-BUG-5 FIX: productId (string) matches API expectation {productId}
  getWaitlist: () => sovereignClient.get<unknown>('/bookings/waitlist/'),
  addToWaitlist: (data: { productId: string; preferred_start?: string }) =>
    sovereignClient.post<unknown>('/bookings/waitlist/', data),
  removeFromWaitlist: (id: string) =>
    sovereignClient.delete<void>(`/bookings/waitlist/${id}/`),

  // Aliases used by pages
  getById: (id: string) => 
    sovereignClient.get<Booking>(`/bookings/${id}/`),

  // Agreements
  generateAgreement: (bookingId: string) => 
    sovereignClient.post<unknown>(`/bookings/${bookingId}/agreement/create/`),
};
