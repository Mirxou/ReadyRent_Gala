import { sovereignClient } from './sovereign-client';

// Helper to build query string from params object
function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) qs.append(key, String(val));
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const adminApi = {
  getDashboardStats: () =>
    sovereignClient.get<any>('/analytics/admin/dashboard/'),

  getRevenue: (params?: { days?: number }) =>
    sovereignClient.get<any>(`/analytics/admin/revenue/${buildQuery(params)}`),

  // Bookings Admin
  getAllBookings: (params?: any) =>
    sovereignClient.get<any[]>(`/bookings/admin/${buildQuery(params)}`),

  updateBooking: (id: number, data: any) =>
    sovereignClient.patch<any>(`/bookings/admin/${id}/`, data),

  // Products Admin
  getAllProducts: (params?: any) =>
    sovereignClient.get<any[]>(`/products/admin/products/${buildQuery(params)}`),

  createProduct: (data: any) =>
    sovereignClient.post<any>('/products/admin/products/', data),

  // Users Admin
  getAllUsers: (params?: any) =>
    sovereignClient.get<any[]>(`/auth/admin/users/${buildQuery(params)}`),
};


