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
    sovereignClient.get<unknown>('/analytics/admin/dashboard/'),

  getRevenue: (params?: { days?: number }) =>
    sovereignClient.get<unknown>(`/analytics/admin/revenue/${buildQuery(params)}`),

  // Bookings Admin
  getAllBookings: (params?: Record<string, unknown>) =>
    sovereignClient.get<unknown[]>(`/bookings/admin/${buildQuery(params)}`),

  updateBooking: (id: number, data: Record<string, unknown>) =>
    sovereignClient.patch<unknown>(`/bookings/admin/${id}/`, data),

  // Products Admin
  getAllProducts: (params?: Record<string, unknown>) =>
    sovereignClient.get<unknown[]>(`/products/admin/products/${buildQuery(params)}`),

  createProduct: (data: Record<string, unknown>) =>
    sovereignClient.post<unknown>('/products/admin/products/', data),

  // Users Admin
  getAllUsers: (params?: Record<string, unknown>) =>
    sovereignClient.get<unknown[]>(`/auth/admin/users/${buildQuery(params)}`),

  updateUser: (id: number, data: Record<string, unknown>) =>
    sovereignClient.patch<unknown>(`/auth/admin/users/${id}/`, data),

  deleteProduct: (id: number) =>
    sovereignClient.delete<void>(`/products/admin/products/${id}/`),

  getBookingStats: () =>
    sovereignClient.get<unknown>('/bookings/admin/stats/'),

  getSalesReport: (params?: { days?: number; export?: boolean }) =>
    sovereignClient.get<unknown>(`/analytics/admin/sales-report/${buildQuery(params)}`),
};


