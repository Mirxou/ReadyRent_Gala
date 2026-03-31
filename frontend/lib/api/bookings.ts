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
    sovereignClient.patch<Booking>(`/bookings/${id}/update/`, data),

  cancel: (id: number) => 
    sovereignClient.post<void>(`/bookings/${id}/cancel/`),

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

  // Agreements
  generateAgreement: (bookingId: number) => 
    sovereignClient.post<any>(`/bookings/${bookingId}/agreement/create/`),
};
