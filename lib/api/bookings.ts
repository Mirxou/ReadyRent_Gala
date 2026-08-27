import { sovereignClient } from './sovereign-client';

export interface BookingCreateData {
  product_id: number;
  start_date: string;
  end_date: string;
  has_insurance: boolean;
  extra_services: string[];
}

export interface Booking {
  id: number;
  product_id: number;
  product_name: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  escrow_status: string;
}

export const bookingsApi = {
  create: (data: BookingCreateData) => 
    sovereignClient.post<Booking>('/bookings/create/', data),

  list: (params?: any) => 
    sovereignClient.get<Booking[]>('/bookings/', { params }),

  getAll: (params?: any) => 
    sovereignClient.get<Booking[]>('/bookings/', { params }),

  getDetail: (id: number) => 
    sovereignClient.get<Booking>(`/bookings/${id}/`),

  update: (id: number, data: any) => 
    sovereignClient.patch<Booking>(`/bookings/${id}`, data),

  /** Alias used by dashboard/orders — updates a single status field */
  updateStatus: (id: number, status: string) => 
    sovereignClient.patch<Booking>(`/bookings/${id}/`, { status }),

  cancel: (id: number) => 
    sovereignClient.post<void>(`/bookings/${id}/cancel`),

  calculateDeposit: (productId: number) => 
    sovereignClient.get<{ deposit_amount: number }>('/bookings/calculate-deposit/', { 
      params: new URLSearchParams({ product_id: productId.toString() }) 
    }),

  // Cart
  getCart: () => sovereignClient.get<any>('/bookings/cart/'),
  
  addToCart: (data: { product_id: number; start_date: string; end_date: string }) => 
    sovereignClient.post<any>('/bookings/cart/items/', data),
  
  removeFromCart: (itemId: number) => 
    sovereignClient.delete<void>(`/bookings/cart/items/${itemId}/`),

  // Waitlist
  getWaitlist: () => sovereignClient.get<any>('/bookings/waitlist/'),
  addToWaitlist: (data: { product_id: number | string; start_date?: string; end_date?: string }) =>
    sovereignClient.post<any>('/bookings/waitlist/', data),
  removeFromWaitlist: (id: number) =>
    sovereignClient.delete<void>(`/bookings/waitlist/${id}/`),

  // Aliases used by pages
  getById: (id: string | number) => 
    sovereignClient.get<Booking>(`/bookings/${id}/`),

  // Agreements
  generateAgreement: (bookingId: number) => 
    sovereignClient.post<any>(`/bookings/${bookingId}/agreement/create/`),
};
