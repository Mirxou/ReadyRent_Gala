/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

// 🛡️ INVESTOR-GRADE SECURITY: Cookie-First Architecture
// No localStorage, No Authorization headers.
// Browser handles cookies automatically via 'withCredentials: true'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true, // Critical: Sends HttpOnly cookies
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken', // Protection against CSRF
  paramsSerializer: (params: any) => {
    // Convert arrays to Django getlist format: ?sizes=XXXL&sizes=XXL
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        value.forEach((item: any) => {
          searchParams.append(key, String(item));
        });
      } else if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  },
});

// Response Interceptor: Handle unwrapping of Sovereign Envelope & 401 Refresh
api.interceptors.response.use(
  (response) => {
    // Phase 5: Sovereign Unwrapping
    // Automatically extract .data from { success, data, meta } envelope
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
       // Attached metadata for components that need it (e.g. pagination)
       (response as any).meta = response.data.meta;
       // Transparently set .data to the actual payload
       response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;


    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'انتهت مهلة الاتصال. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.';
      } else if (error.message === 'Network Error') {
        error.message = `لا يمكن الاتصال بالخادم. تأكد من أن الـ backend يعمل على ${API_BASE_URL}`;
      } else {
        error.message = error.message || 'خطأ في الاتصال بالخادم';
      }
      return Promise.reject(error);
    }

    // Prevent infinite loops [Critical]
    // If 401 happens, try to refresh via cookie
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔄 401 Detected: Attempting Silent Refresh via Cookie...');
        // Call refresh endpoint - Backend reads 'refresh_token' cookie automatically
        await api.post('/auth/token/refresh/');

        console.log('✅ Refresh Successful: Retrying original request');
        // Retry original request (Browser sends new 'access_token' cookie)
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Refresh Failed: Session expired or invalid');
        // Optional: Redirect to login or clear client state
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Dignity Preserved Error Handling
    if (error.response?.data?.dignity_preserved) {
      // Handle specialized sovereign errors if needed
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  register: (data: any) => api.post('/auth/register/', data),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/profile/'),
  passwordResetRequest: (email: string) => api.post('/auth/password/reset/request/', { email }),
  passwordResetConfirm: (token: string, uid: string, password: string, passwordConfirm: string) => api.post('/auth/password/reset/confirm/', { token, uid, password, password_confirm: passwordConfirm }),
  // Sovereign Guard (Phase 6)
  generate2FASecret: () => api.post('/auth/security/2fa/generate/'),
  enable2FA: (data: { secret: string; token: string }) => api.post('/auth/security/2fa/enable/', data),
};

export const verificationApi = {
  getStatus: () => api.get('/auth/verification/'),
  requestPhoneVerification: (data: any) => api.post('/auth/verification/phone/request/', data),
  verifyPhone: (data: any) => api.post('/auth/verification/phone/verify/', data),
  uploadID: (data: FormData) => api.post('/auth/verification/id/upload/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verifyAddress: (data: any) => api.post('/auth/verification/address/', data),
};

export const adminVerificationApi = {
  getAll: (params?: any) => api.get('/auth/admin/verifications/', { params }),
  approve: (userId: number) => api.post(`/auth/admin/verifications/${userId}/approve/`),
  reject: (userId: number, reason?: string) => api.post(`/auth/admin/verifications/${userId}/reject/`, { reason }),
};

export const blacklistApi = {
  getAll: (params?: any) => api.get('/auth/admin/blacklist/', { params }),
  add: (data: any) => api.post('/auth/admin/blacklist/add/', data),
};

export const staffApi = {
  getList: (params?: any) => api.get('/auth/staff/list/', { params }),
  // Roles
  getRoles: (params?: any) => api.get('/auth/staff/roles/', { params }),
  createRole: (data: any) => api.post('/auth/staff/roles/', data),
  updateRole: (id: number, data: any) => api.patch(`/auth/staff/roles/${id}/`, data),
  deleteRole: (id: number) => api.delete(`/auth/staff/roles/${id}/`),
  // Activity Logs
  getActivityLogs: (params?: any) => api.get('/auth/staff/activity-logs/', { params }),
  getActivityLog: (id: number) => api.get(`/auth/staff/activity-logs/${id}/`),
  // Shifts
  getShifts: (params?: any) => api.get('/auth/staff/shifts/', { params }),
  createShift: (data: any) => api.post('/auth/staff/shifts/', data),
  updateShift: (id: number, data: any) => api.patch(`/auth/staff/shifts/${id}/`, data),
  deleteShift: (id: number) => api.delete(`/auth/staff/shifts/${id}/`),
  // Performance Reviews
  getPerformanceReviews: (params?: any) => api.get('/auth/staff/performance-reviews/', { params }),
  createPerformanceReview: (data: any) => api.post('/auth/staff/performance-reviews/', data),
  updatePerformanceReview: (id: number, data: any) => api.patch(`/auth/staff/performance-reviews/${id}/`, data),
  deletePerformanceReview: (id: number) => api.delete(`/auth/staff/performance-reviews/${id}/`),
};

export const productsApi = {
  getAll: (params?: any) => {
    return api.get('/products/', { params });
  },
  getById: (id: string) => api.get(`/products/${id}/`),
  getBySlug: (slug: string) => api.get(`/products/${slug}/`),
  getCategories: () => api.get('/products/categories/'),
  getMetadata: () => api.get('/products/metadata/'),
  getSearchSuggestions: (query: string) => api.get('/products/search-suggestions/', { params: { q: query } }),
  getMatchingAccessories: (productId: number, limit?: number) =>
    api.get(`/products/${productId}/matching-accessories/`, { params: { limit: limit || 5 } }),
  getRecommendations: (productId: number, limit?: number) =>
    api.get(`/products/${productId}/recommendations/`, { params: { limit: limit || 6 } }),
  // Wishlist
  getWishlist: () => api.get('/products/wishlist/'),
  addToWishlist: (productId: number) => api.post('/products/wishlist/', { product_id: productId }),
  removeFromWishlist: (id: number) => api.delete(`/products/wishlist/${id}/`),
  toggleWishlist: (productId: number) => api.post(`/products/wishlist/toggle/${productId}/`),
  checkWishlist: (productId: number) => api.get(`/products/wishlist/check/${productId}/`),
};

export const bookingsApi = {
  create: (data: any) => api.post('/bookings/create/', data),
  getAll: () => api.get('/bookings/'),
  getById: (id: string) => api.get(`/bookings/${id}/`),
  getCart: () => api.get('/bookings/cart/'),
  addToCart: (data: any) => api.post('/bookings/cart/items/', data),
  removeFromCart: (id: number) => api.delete(`/bookings/cart/items/${id}/`),
  createBookingFromCart: (data?: any) => api.post('/bookings/create/', data),
  update: (id: number, data: any) => api.patch(`/bookings/${id}/update/`, data),
  updateStatus: (id: number, status: string) => api.patch(`/bookings/${id}/status/`, { status }),
  cancel: (id: number) => api.post(`/bookings/${id}/cancel/`),
  getWaitlist: () => api.get('/bookings/waitlist/'),
  addToWaitlist: (data: any) => api.post('/bookings/waitlist/add/', data),
  removeFromWaitlist: (id: number) => api.delete(`/bookings/waitlist/${id}/`),
  getCancellationPolicy: (id: number) => api.get(`/bookings/${id}/cancellation-policy/`),
  earlyReturn: (id: number, data: any) => api.post(`/bookings/${id}/early-return/`, data),
  getRefunds: (params?: any) => api.get('/bookings/refunds/', { params }),
  calculateDeposit: (productId: number) => api.get('/bookings/calculate-deposit/', { params: { product_id: productId } }),
};

export const damageAssessmentApi = {
  create: (data: any) => api.post('/bookings/damage-assessment/', data),
  getById: (id: number) => api.get(`/bookings/damage-assessment/${id}/`),
  uploadPhoto: (data: FormData) => api.post('/bookings/damage-photos/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  createInspectionChecklist: (data: any) => api.post('/bookings/inspection-checklist/', data),
  updateInspectionChecklist: (id: number, data: any) => api.patch(`/bookings/inspection-checklist/${id}/`, data),
  createClaim: (data: any) => api.post('/bookings/damage-claims/', data),
  getClaim: (id: number) => api.get(`/bookings/damage-claims/${id}/`),
};

export const adminApi = {
  // Dashboard stats
  getDashboardStats: () => api.get('/analytics/admin/dashboard/'),
  getRevenue: (params?: { days?: number }) => api.get('/analytics/admin/revenue/', { params }),
  exportRevenueCSV: (params?: { days?: number }) =>
    api.get('/analytics/admin/revenue/export/', { params, responseType: 'blob' }),
  getDailyAnalyticsSummary: (params?: { days?: number }) =>
    api.get('/analytics/daily/summary/', { params }),
  getTopProducts: (params?: { metric?: string }) =>
    api.get('/analytics/products/top_products/', { params }),
  getSalesReport: (params?: { days?: number; export?: boolean }) => {
    if (params?.export) {
      return api.get('/analytics/admin/sales-report/', { params: { ...params, export: 'true' }, responseType: 'blob' });
    }
    return api.get('/analytics/admin/sales-report/', { params });
  },

  // Bookings
  getAllBookings: (params?: any) => api.get('/bookings/admin/', { params }),
  updateBooking: (id: number, data: any) => api.patch(`/bookings/admin/${id}/`, data),
  getBookingStats: () => api.get('/bookings/admin/stats/'),

  // Products
  getAllProducts: (params?: any) => api.get('/products/admin/products/', { params }),
  createProduct: (data: any) => api.post('/products/admin/products/', data),
  updateProduct: (id: number, data: any) => api.patch(`/products/admin/products/${id}/`, data),
  deleteProduct: (id: number) => api.delete(`/products/admin/products/${id}/`),

  // Categories
  getAllCategories: () => api.get('/products/admin/categories/'),
  createCategory: (data: any) => api.post('/products/admin/categories/', data),
  updateCategory: (id: number, data: any) => api.patch(`/products/admin/categories/${id}/`, data),
  deleteCategory: (id: number) => api.delete(`/products/admin/categories/${id}/`),

  // Variants
  getAllVariants: (params?: any) => api.get('/products/admin/variants/', { params }),
  createVariant: (data: any) => api.post('/products/admin/variants/', data),
  updateVariant: (id: number, data: any) => api.patch(`/products/admin/variants/${id}/`, data),
  deleteVariant: (id: number) => api.delete(`/products/admin/variants/${id}/`),

  // Users
  getAllUsers: (params?: any) => api.get('/auth/admin/users/', { params }),
  getUser: (id: number) => api.get(`/auth/admin/users/${id}/`),
  updateUser: (id: number, data: any) => api.patch(`/auth/admin/users/${id}/`, data),
  deleteUser: (id: number) => api.delete(`/auth/admin/users/${id}/`),
};

export const notificationsApi = {
  getAll: () => api.get('/notifications/'),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read/`),
  markAllAsRead: () => api.post('/notifications/mark-all-read/'),
};

export const returnsApi = {
  getAll: () => api.get('/returns/returns/'),
  getMyReturns: () => api.get('/returns/returns/my_returns/'),
  create: (data: any) => api.post('/returns/returns/', data),
  getById: (id: number) => api.get(`/returns/returns/${id}/`),
  updateStatus: (id: number, status: string) => api.patch(`/returns/returns/${id}/`, { status }),
  approve: (id: number, data?: any) => api.post(`/returns/returns/${id}/approve/`, data),
  markReceived: (id: number) => api.post(`/returns/returns/${id}/mark_received/`),
  completeInspection: (id: number, data: any) => api.post(`/returns/returns/${id}/complete_inspection/`, data),
};

export const reviewsApi = {
  getAll: (params?: any) => api.get('/reviews/', { params }),
  create: (data: any) => api.post('/reviews/create/', data),
  moderate: (id: number, status: string) => api.patch(`/reviews/${id}/moderate/`, { status }),
};

export const maintenanceApi = {
  // Periods
  getPeriods: (params?: any) => api.get('/maintenance/periods/', { params }),
  getPeriodsList: (params?: any) => api.get('/maintenance/periods/list/', { params }),
  createPeriod: (data: any) => api.post('/maintenance/periods/', data),
  updatePeriod: (id: number, data: any) => api.patch(`/maintenance/periods/${id}/`, data),
  deletePeriod: (id: number) => api.delete(`/maintenance/periods/${id}/`),
  // Schedules
  getSchedules: (params?: any) => api.get('/maintenance/schedules/', { params }),
  getSchedulesList: (params?: any) => api.get('/maintenance/schedules/list/', { params }),
  createSchedule: (data: any) => api.post('/maintenance/schedules/', data),
  updateSchedule: (id: number, data: any) => api.patch(`/maintenance/schedules/${id}/`, data),
  deleteSchedule: (id: number) => api.delete(`/maintenance/schedules/${id}/`),
  // Records
  getRecords: (params?: any) => api.get('/maintenance/records/', { params }),
  createRecord: (data: any) => api.post('/maintenance/records/', data),
  updateRecord: (id: number, data: any) => api.patch(`/maintenance/records/${id}/`, data),
  deleteRecord: (id: number) => api.delete(`/maintenance/records/${id}/`),
};

export const hygieneApi = {
  // Records
  getRecords: (params?: any) => api.get('/hygiene/hygiene-records/', { params }),
  getRecord: (id: number) => api.get(`/hygiene/hygiene-records/${id}/`),
  createRecord: (data: any) => api.post('/hygiene/hygiene-records/', data),
  updateRecord: (id: number, data: any) => api.patch(`/hygiene/hygiene-records/${id}/`, data),
  deleteRecord: (id: number) => api.delete(`/hygiene/hygiene-records/${id}/`),
  getLatestForProduct: (productId: number) => api.get('/hygiene/hygiene-records/latest_for_product/', { params: { product: productId } }),
  // Certificates
  getCertificates: (params?: any) => api.get('/hygiene/certificates/', { params }),
  getCertificate: (id: number) => api.get(`/hygiene/certificates/${id}/`),
  createCertificate: (data: any) => api.post('/hygiene/certificates/', data),
  updateCertificate: (id: number, data: any) => api.patch(`/hygiene/certificates/${id}/`, data),
  deleteCertificate: (id: number) => api.delete(`/hygiene/certificates/${id}/`),
};

export const locationsApi = {
  // Addresses
  getMyAddresses: () => api.get('/locations/addresses/'),
  getAllAddresses: (params?: any) => api.get('/locations/addresses/', { params }),
  getAddress: (id: number) => api.get(`/locations/addresses/${id}/`),
  createAddress: (data: any) => api.post('/locations/addresses/', data),
  updateAddress: (id: number, data: any) => api.patch(`/locations/addresses/${id}/`, data),
  deleteAddress: (id: number) => api.delete(`/locations/addresses/${id}/`),
  // Delivery Zones
  getDeliveryZones: (params?: any) => api.get('/locations/delivery-zones/', { params }),
  getDeliveryZone: (id: number) => api.get(`/locations/delivery-zones/${id}/`),
  createDeliveryZone: (data: any) => api.post('/locations/delivery-zones/', data),
  updateDeliveryZone: (id: number, data: any) => api.patch(`/locations/delivery-zones/${id}/`, data),
  deleteDeliveryZone: (id: number) => api.delete(`/locations/delivery-zones/${id}/`),
  checkSameDayDelivery: (zoneId: number) => api.get(`/locations/delivery-zones/${zoneId}/check_same_day/`),
  // Deliveries
  getMyDeliveries: () => api.get('/locations/delivery-requests/my_deliveries/'),
  getDeliveries: (params?: any) => api.get('/locations/deliveries/', { params }),
  getDelivery: (id: number) => api.get(`/locations/deliveries/${id}/`),
  createDelivery: (data: any) => api.post('/locations/deliveries/', data),
  updateDelivery: (id: number, data: any) => api.patch(`/locations/deliveries/${id}/`, data),
  deleteDelivery: (id: number) => api.delete(`/locations/deliveries/${id}/`),
  getDeliveryTracking: (id: number) => api.get(`/locations/delivery-requests/${id}/`),
  updateTracking: (id: number, data: any) => api.post(`/locations/delivery-requests/${id}/update_tracking/`, data),
  // Tracking
  getTracking: (params?: any) => api.get('/locations/tracking/', { params }),
  getTrackingById: (id: number) => api.get(`/locations/tracking/${id}/`),
  // Geocoding
  geocodeAddress: (address: string) => api.post('/locations/geocode/', { address }),
  reverseGeocode: (latitude: number, longitude: number) => api.post('/locations/reverse-geocode/', { latitude, longitude }),
  getPlaceDetails: (placeId: string) => api.post('/locations/place-details/', { place_id: placeId }),
};

export const warrantiesApi = {
  // Warranty Plans
  getPlans: (params?: any) => api.get('/warranties/warranty-plans/', { params }),
  getPlan: (id: number) => api.get(`/warranties/warranty-plans/${id}/`),
  calculatePrice: (planId: number, rentalPrice: number) => api.get(`/warranties/warranty-plans/${planId}/calculate_price/`, { params: { rental_price: rentalPrice } }),
  // Warranty Purchases
  getPurchases: (params?: any) => api.get('/warranties/warranty-purchases/', { params }),
  getPurchase: (id: number) => api.get(`/warranties/warranty-purchases/${id}/`),
  purchase: (data: any) => api.post('/warranties/warranty-purchases/', data),
  // Warranty Claims
  getClaims: (params?: any) => api.get('/warranties/claims/', { params }),
  getClaim: (id: number) => api.get(`/warranties/claims/${id}/`),
  createClaim: (data: any) => api.post('/warranties/claims/', data),
  updateClaim: (id: number, data: any) => api.patch(`/warranties/claims/${id}/`, data),
  // Insurance Plans
  getInsurancePlans: (params?: any) => api.get('/warranties/insurance/plans/', { params }),
  getInsurancePlan: (id: number) => api.get(`/warranties/insurance/plans/${id}/`),
  calculateInsurance: (data: any) => api.post('/warranties/insurance/calculator/', data),
  getRecommendedInsurance: (params?: any) => api.get('/warranties/insurance/recommended/', { params }),
  // Insurance Claims
  createInsuranceClaim: (data: any) => api.post('/warranties/insurance/claims/', data),
  processInsuranceClaim: (id: number, data: any) => api.post(`/warranties/insurance/claims/${id}/process/`, data),
};

export const packagingApi = {
  // Types
  getTypes: (params?: any) => api.get('/packaging/types/', { params }),
  getType: (id: number) => api.get(`/packaging/types/${id}/`),
  createType: (data: any) => api.post('/packaging/types/', data),
  updateType: (id: number, data: any) => api.patch(`/packaging/types/${id}/`, data),
  deleteType: (id: number) => api.delete(`/packaging/types/${id}/`),
  // Materials
  getMaterials: (params?: any) => api.get('/packaging/materials/', { params }),
  getMaterial: (id: number) => api.get(`/packaging/materials/${id}/`),
  createMaterial: (data: any) => api.post('/packaging/materials/', data),
  updateMaterial: (id: number, data: any) => api.patch(`/packaging/materials/${id}/`, data),
  deleteMaterial: (id: number) => api.delete(`/packaging/materials/${id}/`),
  // Rules
  getRules: (params?: any) => api.get('/packaging/rules/', { params }),
  getRule: (id: number) => api.get(`/packaging/rules/${id}/`),
  createRule: (data: any) => api.post('/packaging/rules/', data),
  updateRule: (id: number, data: any) => api.patch(`/packaging/rules/${id}/`, data),
  deleteRule: (id: number) => api.delete(`/packaging/rules/${id}/`),
  // Instances
  getInstances: (params?: any) => api.get('/packaging/instances/', { params }),
  getInstance: (id: number) => api.get(`/packaging/instances/${id}/`),
  createInstance: (data: any) => api.post('/packaging/instances/', data),
  updateInstance: (id: number, data: any) => api.patch(`/packaging/instances/${id}/`, data),
  deleteInstance: (id: number) => api.delete(`/packaging/instances/${id}/`),
  getSuggestedForBooking: (params: { product_id: number; rental_days?: number; booking_id?: number }) =>
    api.get('/packaging/instances/suggested_for_booking/', { params }),
};

export const chatbotApi = {
  createSession: (data?: { language?: string }) => api.post('/chatbot/sessions/create_anonymous/', data || {}),
  getMySessions: () => api.get('/chatbot/sessions/my_sessions/'),
  getSession: (id: number) => api.get(`/chatbot/sessions/${id}/`),
  sendMessage: (sessionId: number, message: string) => api.post(`/chatbot/sessions/${sessionId}/send_message/`, { message }),
  quickChat: (message: string, language?: string) => api.post('/chatbot/quick-chat/', { message, language: language || 'ar' }),
};

export const localGuideApi = {
  getCategories: () => api.get('/local-guide/categories/'),
  getServices: (params?: any) => api.get('/local-guide/services/', { params }),
  getServiceById: (id: number) => api.get(`/local-guide/services/${id}/`),
  createReview: (data: any) => api.post('/local-guide/reviews/', data),
  getReviews: (params?: any) => api.get('/local-guide/reviews/', { params }),
};

export const artisansApi = {
  // Artisans
  getAll: (params?: any) => api.get('/artisans/artisans/', { params }),
  getById: (id: number) => api.get(`/artisans/artisans/${id}/`),
  createArtisan: (data: any) => api.post('/artisans/artisans/', data),
  updateArtisan: (id: number, data: any) => api.patch(`/artisans/artisans/${id}/`, data),
  deleteArtisan: (id: number) => api.delete(`/artisans/artisans/${id}/`),
  getProducts: (artisanId: number, params?: any) => api.get(`/artisans/artisans/${artisanId}/products/`, { params }),
  // Artisan Reviews
  getArtisanReviews: (params?: any) => api.get('/artisans/reviews/', { params }),
  getArtisanReview: (id: number) => api.get(`/artisans/reviews/${id}/`),
  createArtisanReview: (data: any) => api.post('/artisans/reviews/', data),
  updateArtisanReview: (id: number, data: any) => api.patch(`/artisans/reviews/${id}/`, data),
  deleteArtisanReview: (id: number) => api.delete(`/artisans/reviews/${id}/`),
};

export const bundlesApi = {
  // Categories
  getCategories: (params?: any) => api.get('/bundles/categories/', { params }),
  getCategory: (id: number) => api.get(`/bundles/categories/${id}/`),
  createCategory: (data: any) => api.post('/bundles/categories/', data),
  updateCategory: (id: number, data: any) => api.patch(`/bundles/categories/${id}/`, data),
  deleteCategory: (id: number) => api.delete(`/bundles/categories/${id}/`),
  // Bundles
  getAll: (params?: any) => api.get('/bundles/bundles/', { params }),
  getById: (id: number) => api.get(`/bundles/bundles/${id}/`),
  createBundle: (data: any) => api.post('/bundles/bundles/', data),
  updateBundle: (id: number, data: any) => api.patch(`/bundles/bundles/${id}/`, data),
  deleteBundle: (id: number) => api.delete(`/bundles/bundles/${id}/`),
  calculatePrice: (bundleId: number, params: { start_date: string; end_date: string }) =>
    api.get(`/bundles/bundles/${bundleId}/calculate_price/`, { params }),
  // Bundle Bookings
  getBundleBookings: (params?: any) => api.get('/bundles/bookings/', { params }),
  getBundleBooking: (id: number) => api.get(`/bundles/bookings/${id}/`),
  createBooking: (data: any) => api.post('/bundles/bookings/', data),
  updateBundleBooking: (id: number, data: any) => api.patch(`/bundles/bookings/${id}/`, data),
  deleteBundleBooking: (id: number) => api.delete(`/bundles/bookings/${id}/`),
  // Bundle Reviews
  getBundleReviews: (params?: any) => api.get('/bundles/reviews/', { params }),
  getBundleReview: (id: number) => api.get(`/bundles/reviews/${id}/`),
  createBundleReview: (data: any) => api.post('/bundles/reviews/', data),
  updateBundleReview: (id: number, data: any) => api.patch(`/bundles/reviews/${id}/`, data),
  deleteBundleReview: (id: number) => api.delete(`/bundles/reviews/${id}/`),
};

// Inventory API
export const inventoryApi = {
  // Inventory Items
  getItems: (params?: any) => api.get('/inventory/inventory/', { params }),
  getItem: (id: number) => api.get(`/inventory/inventory/${id}/`),
  createItem: (data: any) => api.post('/inventory/inventory/', data),
  updateItem: (id: number, data: any) => api.patch(`/inventory/inventory/${id}/`, data),
  deleteItem: (id: number) => api.delete(`/inventory/inventory/${id}/`),
  // Stock Alerts
  getStockAlerts: (params?: any) => api.get('/inventory/stock-alerts/', { params }),
  getStockAlert: (id: number) => api.get(`/inventory/stock-alerts/${id}/`),
  createStockAlert: (data: any) => api.post('/inventory/stock-alerts/', data),
  updateStockAlert: (id: number, data: any) => api.patch(`/inventory/stock-alerts/${id}/`, data),
  deleteStockAlert: (id: number) => api.delete(`/inventory/stock-alerts/${id}/`),
  // Stock Movements
  getStockMovements: (params?: any) => api.get('/inventory/stock-movements/', { params }),
  getStockMovement: (id: number) => api.get(`/inventory/stock-movements/${id}/`),
  createStockMovement: (data: any) => api.post('/inventory/stock-movements/', data),
  updateStockMovement: (id: number, data: any) => api.patch(`/inventory/stock-movements/${id}/`, data),
  deleteStockMovement: (id: number) => api.delete(`/inventory/stock-movements/${id}/`),
};

// Disputes API
export const disputesApi = {
  // Disputes
  getDisputes: (params?: any) => api.get('/disputes/disputes/', { params }),
  getDispute: (id: number) => api.get(`/disputes/disputes/${id}/`),
  createDispute: (data: any) => api.post('/disputes/disputes/create/', data),
  createDisputeMessage: (disputeId: number, data: any) => api.post(`/disputes/disputes/${disputeId}/messages/`, data),
  // Support Tickets
  getTickets: (params?: any) => api.get('/disputes/tickets/', { params }),
  getTicket: (id: number) => api.get(`/disputes/tickets/${id}/`),
  createTicket: (data: any) => api.post('/disputes/tickets/create/', data),
  createTicketMessage: (ticketId: number, data: any) => api.post(`/disputes/tickets/${ticketId}/messages/`, data),
  // Admin Stats
  getDisputeStats: () => api.get('/disputes/admin/disputes/stats/'),
  getTicketStats: () => api.get('/disputes/admin/tickets/stats/'),
  // High Court Integrity (Phase 6)
  getVaultIntegrity: () => api.get('/disputes/admin/vault/integrity/'),
};

// Vendors API
export const vendorsApi = {
  // Public
  getAll: (params?: any) => api.get('/vendors/', { params }),
  getById: (id: number) => api.get(`/vendors/${id}/`),
  // Vendor Management
  register: (data: any) => api.post('/vendors/register/', data),
  getProfile: () => api.get('/vendors/profile/'),
  updateProfile: (data: any) => api.patch('/vendors/profile/', data),
  getDashboard: () => api.get('/vendors/dashboard/'),
  getProducts: (params?: any) => api.get('/vendors/products/', { params }),
  getPerformance: (params?: any) => api.get('/vendors/performance/', { params }),
  // Admin
  adminGetAll: (params?: any) => api.get('/vendors/admin/vendors/', { params }),
  adminGetById: (id: number) => api.get(`/vendors/admin/vendors/${id}/`),
  adminCreate: (data: any) => api.post('/vendors/admin/vendors/', data),
  adminUpdate: (id: number, data: any) => api.patch(`/vendors/admin/vendors/${id}/`, data),
  adminDelete: (id: number) => api.delete(`/vendors/admin/vendors/${id}/`),
  // Commissions
  getCommissions: (params?: any) => api.get('/vendors/admin/commissions/', { params }),
  processCommission: (id: number, data: any) => api.post(`/vendors/admin/commissions/${id}/process/`, data),
};

// Branches API
export const branchesApi = {
  // Public
  getAll: (params?: any) => api.get('/branches/', { params }),
  getById: (id: number) => api.get(`/branches/${id}/`),
  getStats: (id: number) => api.get(`/branches/${id}/stats/`),
  // Inventory
  getInventory: (params?: any) => api.get('/branches/inventory/', { params }),
  getInventoryById: (id: number) => api.get(`/branches/inventory/${id}/`),
  // Staff
  getStaff: (params?: any) => api.get('/branches/staff/', { params }),
  // Performance
  getPerformance: (params?: any) => api.get('/branches/performance/', { params }),
  // Admin
  adminGetAll: (params?: any) => api.get('/branches/admin/branches/', { params }),
  adminGetById: (id: number) => api.get(`/branches/admin/branches/${id}/`),
  adminCreate: (data: any) => api.post('/branches/admin/branches/', data),
  adminUpdate: (id: number, data: any) => api.patch(`/branches/admin/branches/${id}/`, data),
  adminDelete: (id: number) => api.delete(`/branches/admin/branches/${id}/`),
  // Admin Inventory
  adminGetInventory: (params?: any) => api.get('/branches/admin/inventory/', { params }),
  adminGetInventoryById: (id: number) => api.get(`/branches/admin/inventory/${id}/`),
  adminCreateInventory: (data: any) => api.post('/branches/admin/inventory/', data),
  adminUpdateInventory: (id: number, data: any) => api.patch(`/branches/admin/inventory/${id}/`, data),
  adminDeleteInventory: (id: number) => api.delete(`/branches/admin/inventory/${id}/`),
};

// CMS API
export const cmsApi = {
  // Pages
  getPages: (params?: any) => api.get('/cms/pages/', { params }),
  getPage: (id: number) => api.get(`/cms/pages/${id}/`),
  createPage: (data: any) => api.post('/cms/pages/', data),
  updatePage: (id: number, data: any) => api.patch(`/cms/pages/${id}/`, data),
  deletePage: (id: number) => api.delete(`/cms/pages/${id}/`),
  // Blog Posts
  getBlogPosts: (params?: any) => api.get('/cms/blog/', { params }),
  getBlogPost: (id: number) => api.get(`/cms/blog/${id}/`),
  createBlogPost: (data: any) => api.post('/cms/blog/', data),
  updateBlogPost: (id: number, data: any) => api.patch(`/cms/blog/${id}/`, data),
  deleteBlogPost: (id: number) => api.delete(`/cms/blog/${id}/`),
  // Banners
  getBanners: (params?: any) => api.get('/cms/banners/', { params }),
  getBanner: (id: number) => api.get(`/cms/banners/${id}/`),
  createBanner: (data: any) => api.post('/cms/banners/', data),
  updateBanner: (id: number, data: any) => api.patch(`/cms/banners/${id}/`, data),
  deleteBanner: (id: number) => api.delete(`/cms/banners/${id}/`),
  // FAQs
  getFAQs: (params?: any) => api.get('/cms/faqs/', { params }),
  getFAQ: (id: number) => api.get(`/cms/faqs/${id}/`),
  createFAQ: (data: any) => api.post('/cms/faqs/', data),
  updateFAQ: (id: number, data: any) => api.patch(`/cms/faqs/${id}/`, data),
  deleteFAQ: (id: number) => api.delete(`/cms/faqs/${id}/`),
  markFAQHelpful: (id: number) => api.post(`/cms/faqs/${id}/helpful/`),
};

// Analytics API
export const analyticsApi = {
  // Events
  trackEvent: (data: any) => api.post('/analytics/events/', data),
  getEvents: (params?: any) => api.get('/analytics/events/', { params }),
  getEvent: (id: number) => api.get(`/analytics/events/${id}/`),
  // Product Analytics
  getProductAnalytics: (params?: any) => api.get('/analytics/products/', { params }),
  getProductAnalytic: (id: number) => api.get(`/analytics/products/${id}/`),
  // Daily Analytics
  getDailyAnalytics: (params?: any) => api.get('/analytics/daily/', { params }),
  getDailyAnalytic: (id: number) => api.get(`/analytics/daily/${id}/`),
  // User Behavior
  getUserBehavior: (params?: any) => api.get('/analytics/user-behavior/', { params }),
  getUserBehaviorById: (id: number) => api.get(`/analytics/user-behavior/${id}/`),
  getProductActivity: (productId: number) => api.get(`/analytics/live/activity/${productId}/`),
};

// Payments API
export const paymentsApi = {
  // Payment Methods
  getMethods: () => api.get('/payments/methods/'),
  // Payments
  getAll: (params?: any) => api.get('/payments/payments/', { params }),
  getById: (id: number) => api.get(`/payments/payments/${id}/`),
  create: (data: any) => api.post('/payments/create/', data),
  update: (id: number, data: any) => api.patch(`/payments/payments/${id}/`, data),
  delete: (id: number) => api.delete(`/payments/payments/${id}/`),
  // Payment Actions
  verifyOtp: (id: number, otpCode: string) => api.post(`/payments/payments/${id}/verify_otp/`, { otp_code: otpCode }),
  getStatus: (id: number) => api.get(`/payments/payments/${id}/status/`),
  getEscrowMetrics: () => api.get('/payments/metrics/'),
};
// Social & Community Intelligence
export const socialApi = {
  vouch: (userId: number) => api.post(`/social/vouch/${userId}/`),
  getSocialScore: (userId: number) => api.get(`/social/score/${userId}/`),
  getFeed: (params?: any) => api.get('/social/feed/', { params }),
  // Advanced: Scrapped Market Trends (from skills)
  getMarketPulse: (params?: { platform?: string; keyword?: string }) => 
    api.get('/social/pulse/', { params }),
};

// Sovereign Judicial Protocol (Disputes & Tribunal)
export const judicialApi = {
  initiateDispute: (data: any) => api.post('/v1/judicial/disputes/initiate/', data),
  getDisputeStatus: (id: number) => api.get(`/v1/judicial/disputes/${id}/status/`),
  issueVerdict: (id: number, data: any) => api.post(`/v1/judicial/disputes/${id}/verdict/`, data),
  appealVerdict: (id: number, data: any) => api.post(`/v1/judicial/disputes/${id}/appeal/`, data),
  closeDispute: (id: number) => api.post(`/v1/judicial/disputes/${id}/close/`),
  // Internal Tribunal Portal
  getCaseDetail: (id: number) => api.get(`/v1/tribunal/cases/${id}/`),
  // Public Ledger & Transparency
  getPublicLedger: (params?: any) => api.get('/v1/public/judgments/', { params }),
  getPublicMetrics: () => api.get('/v1/public/metrics/'),
};

// McKinsey-Grade Intelligence Hub (Phase 12 Integration)
export const intelligenceApi = {
  getMarketReport: (params?: { industry?: string; region?: string }) => 
    api.get('/analytics/intelligence/report/', { params }),
  getRegionalLiquidity: () => api.get('/analytics/admin/regional-liquidity/'),
  getPulse: () => api.get('/analytics/intelligence/pulse/'),
  getPredictivePulse: () => api.get('/analytics/daily/summary/'),
  // Forensic Visuals (VisualLab principles)
  getInfographicData: (type: string) => api.get(`/analytics/visuals/${type}/`),
};
