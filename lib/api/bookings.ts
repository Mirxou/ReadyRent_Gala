import { sovereignClient } from './sovereign-client';

export interface BookingCreateData {
  product_id: string;
  start_date: string;
  end_date: string;
  has_insurance?: boolean;
  extra_services?: string[];
  // Optional extras accepted by the create endpoint (signature flow, cart
  // quantity, artisan routing) — backend payload shape is dynamic.
  quantity?: number;
  signature_proof?: string;
  artisan_id?: number;
  [key: string]: any;
}

export interface Booking {
  id: string;
  product_id: string | null;
  product_name: string | null;
  // Dates always serialized for list/detail responses (formatted unconditionally)
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  escrow_status: string;
  created_at?: string;
  // Detail/list serializer extras consumed by dashboard + order pages;
  // shape unverified against backend — extras flow through the index.
  product?: {
    id?: string;
    slug?: string;
    name_ar?: string | null;
    primary_image?: string | null;
    images?: { image?: string | null; url?: string | null }[];
    category?: { name_ar?: string | null } | null;
    [key: string]: any;
  } | null;
  product_image?: string | null;
  // Post-rental inspection report attached to completed bookings (serializer
  // extra; consumed by dashboard/orders/[id]).
  return_request?: {
    inspection_date?: string | null;
    inspector?: string | null;
    [key: string]: any;
  } | null;
  total_days?: number;
  duration?: string | number | null;
  rental_unit?: string | null;
  deposit_amount?: number | null;
  late_fee_charged?: number | null;
  is_custom_offer?: boolean;
  custom_offer_note?: string | null;
  [key: string]: any;
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
      params: { product_id: productId },
    }),

  // Cart
  getCart: () => sovereignClient.get<any>('/bookings/cart/'),
  
  addToCart: (data: { product_id: string; start_date: string; end_date: string }) => 
    sovereignClient.post<any>('/bookings/cart/items/', data),
  
  removeFromCart: (itemId: string) => 
    sovereignClient.delete<void>(`/bookings/cart/items/${itemId}/`),

  // Waitlist — WL-BUG-5 FIX: productId (string) matches API expectation {productId}
  getWaitlist: () => sovereignClient.get<any>('/bookings/waitlist/'),
  addToWaitlist: (data: { productId: string; preferred_start?: string }) =>
    sovereignClient.post<any>('/bookings/waitlist/', data),
  removeFromWaitlist: (id: string) =>
    sovereignClient.delete<void>(`/bookings/waitlist/${id}/`),

  // Aliases used by pages
  getById: (id: string) => 
    sovereignClient.get<Booking>(`/bookings/${id}/`),

  // Agreements
  generateAgreement: (bookingId: string) => 
    sovereignClient.post<any>(`/bookings/${bookingId}/agreement/create/`),
};
