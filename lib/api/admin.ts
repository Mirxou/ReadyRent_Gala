import { sovereignClient } from './sovereign-client';

// Helper to build query string from params object
function buildQuery(params?: Record<string, unknown>): string {
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
    sovereignClient.get<any>('/analytics/admin/dashboard'),

  getRevenue: (params?: { days?: number }) =>
    sovereignClient.get<any>(`/analytics/admin/revenue${buildQuery(params)}`),

  // Bookings Admin
  getAllBookings: (params?: Record<string, unknown>) =>
    sovereignClient.get<any[]>(`/admin/bookings${buildQuery(params)}`),

  updateBooking: (id: string, data: Record<string, unknown>) =>
    sovereignClient.patch<any>(`/admin/bookings/${id}`, data),

  // Products Admin
  getAllProducts: (params?: Record<string, unknown>) =>
    sovereignClient.get<any[]>(`/products/admin${buildQuery(params)}`),

  getProduct: (id: string) =>
    sovereignClient.get<any>(`/products/admin/${id}`),

  createProduct: (data: Record<string, unknown>) =>
    sovereignClient.post<any>('/products/admin', data),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    sovereignClient.put<any>(`/products/admin/${id}`, data),

  deleteProduct: (id: string) =>
    sovereignClient.delete<void>(`/products/admin/${id}`),

  // Users Admin
  getAllUsers: (params?: Record<string, unknown>) =>
    sovereignClient.get<any[]>(`/admin/users${buildQuery(params)}`),

  updateUser: (id: string, data: Record<string, unknown>) =>
    sovereignClient.patch<any>(`/admin/users/${id}`, data),

  getBookingStats: () =>
    sovereignClient.get<any>('/admin/bookings/stats'),

  getSalesReport: (params?: { days?: number; export?: boolean }) =>
    sovereignClient.get<any>(`/analytics/admin/sales-report${buildQuery(params)}`),
};
