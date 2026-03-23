import { sovereignClient } from './sovereign-client';

export const adminApi = {
  getDashboardStats: () => sovereignClient.get<any>('/analytics/admin/dashboard/'),
  getRevenue: (params?: { days?: number }) => sovereignClient.get<any>('/analytics/admin/revenue/', { params }),
  
  // Bookings Admin
  getAllBookings: (params?: any) => sovereignClient.get<any[]>('/bookings/admin/', { params }),
  updateBooking: (id: number, data: any) => sovereignClient.patch<any>(`/bookings/admin/${id}/`, data),
  
  // Products Admin
  getAllProducts: (params?: any) => sovereignClient.get<any[]>('/products/admin/products/', { params }),
  createProduct: (data: any) => sovereignClient.post<any>('/products/admin/products/', data),
  
  // Users Admin
  getAllUsers: (params?: any) => sovereignClient.get<any[]>('/auth/admin/users/', { params }),
};

export const notificationsApi = {
  getAll: () => sovereignClient.get<any[]>('/notifications/'),
  markAsRead: (id: number) => sovereignClient.patch<void>(`/notifications/${id}/read/`),
  markAllAsRead: () => sovereignClient.post<void>('/notifications/mark-all-read/'),
};
