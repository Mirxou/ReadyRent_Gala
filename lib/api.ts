/* eslint-disable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════════════
// STANDARD.Rent — Sovereign Unified API Client
// Native fetch to /api/ gateway (ready for real backend integration)
// ═══════════════════════════════════════════════════════════════════

// ──── CSRF Protection ────
function getCsrfToken(): string {
  if (typeof window === 'undefined') return '';
  let token = sessionStorage.getItem('csrf-token');
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem('csrf-token', token);
  }
  return token;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateNonce(): string {
  if (typeof window === 'undefined') return '';
  return crypto.randomUUID().slice(0, 16);
}

// ──── Core Fetch Helper ────
// Returns { data, status, meta } to be compatible with axios response pattern
// that components use: `const res = await api.get(...); const d = res.data;`

async function apiFetch(
  path: string,
  options: {
    method?: string;
    body?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
  } = {},
): Promise<{ data: any; status: number; meta?: any }> {
  let url = `/api/${path.replace(/^\/+/, '')}`;

  // Append query params
  if (options.params) {
    const qs = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        if (Array.isArray(v)) {
          v.forEach((item) => qs.append(k, String(item)));
        } else {
          qs.append(k, String(v));
        }
      }
    });
    const qStr = qs.toString();
    if (qStr) url += (url.includes('?') ? '&' : '?') + qStr;
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const isMutating = options.method && options.method !== 'GET';
  const headers: Record<string, string> = isFormData ? { ...options.headers } : {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (isMutating) {
    headers['X-CSRF-Token'] = getCsrfToken();
  }

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: isFormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    });

    // Handle 204 No Content
    if (res.status === 204) {
      return { data: { success: true }, status: 204 };
    }

    const json = await res.json();

    // Unwrap sovereign envelope: { success, data, meta } → return { data, status, meta }
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return { data: json.data, status: res.status, meta: json.meta };
    }

    // Already raw data
    return { data: json, status: res.status };
  } catch (error) {
    const message = (error as Error)?.message || 'Network error';
    console.warn('API fetch failed:', path, message);
    return { data: { error: message }, status: 0, meta: { failed: true } };
  }
}

// ──── Axios-Compatible `api` Instance ────
// Components use: `api.get('/path')`, `api.post('/path', body)`, etc.
// These return `{ data: ..., status: ... }` just like axios responses.
export const api = {
  get: (url: string, config?: { params?: any; headers?: any }) =>
    apiFetch(url, { method: 'GET', params: config?.params, headers: config?.headers }),

  post: (url: string, body?: any, config?: { headers?: any }) =>
    apiFetch(url, { method: 'POST', body, headers: config?.headers }),

  put: (url: string, body?: any, config?: { headers?: any }) =>
    apiFetch(url, { method: 'PUT', body, headers: config?.headers }),

  patch: (url: string, body?: any, config?: { headers?: any }) =>
    apiFetch(url, { method: 'PATCH', body, headers: config?.headers }),

  delete: (url: string, config?: { headers?: any }) =>
    apiFetch(url, { method: 'DELETE', headers: config?.headers }),
};

// ═══════════════════════════════════════════════════════════════════
// API Endpoint Objects — same shape as before, now using fetch
// ═══════════════════════════════════════════════════════════════════

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch('auth/login/', { method: 'POST', body: { email, password } }),
  register: (data: any) =>
    apiFetch('auth/register/', { method: 'POST', body: data }),
  logout: () =>
    apiFetch('auth/logout/', { method: 'POST' }),
  me: () =>
    apiFetch('auth/profile/'),
  passwordResetRequest: (email: string) =>
    apiFetch('auth/password/reset/request/', { method: 'POST', body: { email } }),
  passwordResetConfirm: (token: string, uid: string, password: string, passwordConfirm: string) =>
    apiFetch('auth/password/reset/confirm/', { method: 'POST', body: { token, uid, password, password_confirm: passwordConfirm } }),
  generate2FASecret: () =>
    apiFetch('auth/security/2fa/generate/', { method: 'POST' }),
  enable2FA: (data: { secret: string; token: string }) =>
    apiFetch('auth/security/2fa/enable/', { method: 'POST', body: data }),
};

export const productsApi = {
  getAll: (params?: any) => apiFetch('products/', { params }),
  getById: (id: string) => apiFetch(`products/${id}/`),
  getBySlug: (slug: string) => apiFetch(`products/${slug}/`),
  getCategories: () => apiFetch('products/categories/'),
  getMetadata: () => apiFetch('products/metadata/'),
  getSearchSuggestions: (query: string) => apiFetch('products/search-suggestions/', { params: { q: query } }),
  getRecommendations: (productId: number, limit?: number) =>
    apiFetch(`products/${productId}/recommendations/`, { params: { limit: limit || 6 } }),
  getWishlist: () => apiFetch('products/wishlist/'),
  addToWishlist: (productId: number) => apiFetch('products/wishlist/', { method: 'POST', body: { product_id: productId } }),
  removeFromWishlist: (id: number) => apiFetch(`products/wishlist/${id}/`, { method: 'DELETE' }),
};

export const bookingsApi = {
  create: (data: any) => apiFetch('bookings/create/', { method: 'POST', body: data }),
  getAll: () => apiFetch('bookings/'),
  getById: (id: string) => apiFetch(`bookings/${id}/`),
  getCart: () => apiFetch('bookings/cart/'),
  addToCart: (data: any) => apiFetch('bookings/cart/items/', { method: 'POST', body: data }),
  removeFromCart: (id: number) => apiFetch(`bookings/cart/items/${id}/`, { method: 'DELETE' }),
  createBookingFromCart: (data?: any) => apiFetch('bookings/create/', { method: 'POST', body: data }),
  getWaitlist: () => apiFetch('bookings/waitlist/'),
  addToWaitlist: (data: any) => apiFetch('bookings/waitlist/add/', { method: 'POST', body: data }),
  removeFromWaitlist: (id: number) => apiFetch(`bookings/waitlist/${id}/`, { method: 'DELETE' }),
  calculateDeposit: (productId: number) => apiFetch('bookings/calculate-deposit/', { params: { product_id: productId } }),
};

export const adminApi = {
  getDashboardStats: () => apiFetch('analytics/admin/dashboard/'),
  getRevenue: (params?: { days?: number }) => apiFetch('analytics/admin/revenue/', { params }),
  exportRevenueCSV: (params?: { days?: number }) => apiFetch('analytics/admin/revenue/export/', { params }),
  getDailyAnalyticsSummary: (params?: { days?: number }) => apiFetch('analytics/daily/summary/', { params }),
  getSalesReport: (params?: { days?: number; export?: boolean }) => apiFetch('analytics/admin/sales-report/', { params }),
  getAllBookings: (params?: any) => apiFetch('bookings/admin/', { params }),
  updateBooking: (id: number, data: any) => apiFetch(`bookings/admin/${id}/`, { method: 'PATCH', body: data }),
  getBookingStats: () => apiFetch('bookings/admin/stats/'),
  getAllProducts: (params?: any) => apiFetch('products/admin/products/', { params }),
  deleteProduct: (id: number) => apiFetch(`products/admin/products/${id}/`, { method: 'DELETE' }),
  getAllUsers: (params?: any) => apiFetch('auth/admin/users/', { params }),
};

export const reviewsApi = {
  getAll: (params?: any) => apiFetch('reviews/', { params }),
  create: (data: any) => apiFetch('reviews/create/', { method: 'POST', body: data }),
};

export const maintenanceApi = {
  getPeriods: (params?: any) => apiFetch('maintenance/periods/', { params }),
  getPeriodsList: (params?: any) => apiFetch('maintenance/periods/list/', { params }),
  createPeriod: (data: any) => apiFetch('maintenance/periods/', { method: 'POST', body: data }),
  updatePeriod: (id: number, data: any) => apiFetch(`maintenance/periods/${id}/`, { method: 'PATCH', body: data }),
  deletePeriod: (id: number) => apiFetch(`maintenance/periods/${id}/`, { method: 'DELETE' }),
  getSchedules: (params?: any) => apiFetch('maintenance/schedules/', { params }),
  getSchedulesList: (params?: any) => apiFetch('maintenance/schedules/list/', { params }),
  createSchedule: (data: any) => apiFetch('maintenance/schedules/', { method: 'POST', body: data }),
  updateSchedule: (id: number, data: any) => apiFetch(`maintenance/schedules/${id}/`, { method: 'PATCH', body: data }),
  deleteSchedule: (id: number) => apiFetch(`maintenance/schedules/${id}/`, { method: 'DELETE' }),
  getRecords: (params?: any) => apiFetch('maintenance/records/', { params }),
  createRecord: (data: any) => apiFetch('maintenance/records/', { method: 'POST', body: data }),
  updateRecord: (id: number, data: any) => apiFetch(`maintenance/records/${id}/`, { method: 'PATCH', body: data }),
  deleteRecord: (id: number) => apiFetch(`maintenance/records/${id}/`, { method: 'DELETE' }),
};

export const hygieneApi = {
  getRecords: (params?: any) => apiFetch('hygiene/hygiene-records/', { params }),
  getRecord: (id: number) => apiFetch(`hygiene/hygiene-records/${id}/`),
  createRecord: (data: any) => apiFetch('hygiene/hygiene-records/', { method: 'POST', body: data }),
  updateRecord: (id: number, data: any) => apiFetch(`hygiene/hygiene-records/${id}/`, { method: 'PATCH', body: data }),
  deleteRecord: (id: number) => apiFetch(`hygiene/hygiene-records/${id}/`, { method: 'DELETE' }),
  getLatestForProduct: (productId: number) => apiFetch('hygiene/hygiene-records/latest_for_product/', { params: { product: productId } }),
  getCertificates: (params?: any) => apiFetch('hygiene/certificates/', { params }),
  getCertificate: (id: number) => apiFetch(`hygiene/certificates/${id}/`),
  createCertificate: (data: any) => apiFetch('hygiene/certificates/', { method: 'POST', body: data }),
  updateCertificate: (id: number, data: any) => apiFetch(`hygiene/certificates/${id}/`, { method: 'PATCH', body: data }),
  deleteCertificate: (id: number) => apiFetch(`hygiene/certificates/${id}/`, { method: 'DELETE' }),
};

export const locationsApi = {
  getMyAddresses: () => apiFetch('locations/addresses/'),
  getAllAddresses: (params?: any) => apiFetch('locations/addresses/', { params }),
  getAddress: (id: number) => apiFetch(`locations/addresses/${id}/`),
  createAddress: (data: any) => apiFetch('locations/addresses/', { method: 'POST', body: data }),
  updateAddress: (id: number, data: any) => apiFetch(`locations/addresses/${id}/`, { method: 'PATCH', body: data }),
  deleteAddress: (id: number) => apiFetch(`locations/addresses/${id}/`, { method: 'DELETE' }),
  getDeliveryZones: (params?: any) => apiFetch('locations/delivery-zones/', { params }),
  getDeliveryZone: (id: number) => apiFetch(`locations/delivery-zones/${id}/`),
  createDeliveryZone: (data: any) => apiFetch('locations/delivery-zones/', { method: 'POST', body: data }),
  updateDeliveryZone: (id: number, data: any) => apiFetch(`locations/delivery-zones/${id}/`, { method: 'PATCH', body: data }),
  deleteDeliveryZone: (id: number) => apiFetch(`locations/delivery-zones/${id}/`, { method: 'DELETE' }),
  checkSameDayDelivery: (zoneId: number) => apiFetch(`locations/delivery-zones/${zoneId}/check_same_day/`),
  getMyDeliveries: () => apiFetch('locations/delivery-requests/my_deliveries/'),
  getDeliveries: (params?: any) => apiFetch('locations/deliveries/', { params }),
  getDelivery: (id: number) => apiFetch(`locations/deliveries/${id}/`),
  createDelivery: (data: any) => apiFetch('locations/deliveries/', { method: 'POST', body: data }),
  updateDelivery: (id: number, data: any) => apiFetch(`locations/deliveries/${id}/`, { method: 'PATCH', body: data }),
  deleteDelivery: (id: number) => apiFetch(`locations/deliveries/${id}/`, { method: 'DELETE' }),
  getDeliveryTracking: (id: number) => apiFetch(`locations/delivery-requests/${id}/`),
  updateTracking: (id: number, data: any) => apiFetch(`locations/delivery-requests/${id}/update_tracking/`, { method: 'POST', body: data }),
  getTracking: (params?: any) => apiFetch('locations/tracking/', { params }),
  getTrackingById: (id: number) => apiFetch(`locations/tracking/${id}/`),
  geocodeAddress: (address: string) => apiFetch('locations/geocode/', { method: 'POST', body: { address } }),
  reverseGeocode: (latitude: number, longitude: number) => apiFetch('locations/reverse-geocode/', { method: 'POST', body: { latitude, longitude } }),
  getPlaceDetails: (placeId: string) => apiFetch('locations/place-details/', { method: 'POST', body: { place_id: placeId } }),
};

export const packagingApi = {
  getTypes: (params?: any) => apiFetch('packaging/types/', { params }),
  getType: (id: number) => apiFetch(`packaging/types/${id}/`),
  createType: (data: any) => apiFetch('packaging/types/', { method: 'POST', body: data }),
  updateType: (id: number, data: any) => apiFetch(`packaging/types/${id}/`, { method: 'PATCH', body: data }),
  deleteType: (id: number) => apiFetch(`packaging/types/${id}/`, { method: 'DELETE' }),
  getMaterials: (params?: any) => apiFetch('packaging/materials/', { params }),
  getMaterial: (id: number) => apiFetch(`packaging/materials/${id}/`),
  createMaterial: (data: any) => apiFetch('packaging/materials/', { method: 'POST', body: data }),
  updateMaterial: (id: number, data: any) => apiFetch(`packaging/materials/${id}/`, { method: 'PATCH', body: data }),
  deleteMaterial: (id: number) => apiFetch(`packaging/materials/${id}/`, { method: 'DELETE' }),
  getRules: (params?: any) => apiFetch('packaging/rules/', { params }),
  getRule: (id: number) => apiFetch(`packaging/rules/${id}/`),
  createRule: (data: any) => apiFetch('packaging/rules/', { method: 'POST', body: data }),
  updateRule: (id: number, data: any) => apiFetch(`packaging/rules/${id}/`, { method: 'PATCH', body: data }),
  deleteRule: (id: number) => apiFetch(`packaging/rules/${id}/`, { method: 'DELETE' }),
  getInstances: (params?: any) => apiFetch('packaging/instances/', { params }),
  getInstance: (id: number) => apiFetch(`packaging/instances/${id}/`),
  createInstance: (data: any) => apiFetch('packaging/instances/', { method: 'POST', body: data }),
  updateInstance: (id: number, data: any) => apiFetch(`packaging/instances/${id}/`, { method: 'PATCH', body: data }),
  deleteInstance: (id: number) => apiFetch(`packaging/instances/${id}/`, { method: 'DELETE' }),
  getSuggestedForBooking: (params: { product_id: number; rental_days?: number; booking_id?: number }) =>
    apiFetch('packaging/instances/suggested_for_booking/', { params }),
};

export const chatbotApi = {
  createSession: (data?: { language?: string }) => apiFetch('chatbot/sessions/create_anonymous/', { method: 'POST', body: data || {} }),
  sendMessage: (sessionId: number, message: string) => apiFetch(`chatbot/sessions/${sessionId}/send_message/`, { method: 'POST', body: { message } }),
  quickChat: (message: string, options?: { language?: string; [key: string]: any }) =>
    apiFetch('chatbot/quick-chat/', { method: 'POST', body: { message, language: options?.language || 'ar', ...options } }),
};

export const bundlesApi = {
  getAll: (params?: any) => apiFetch('bundles/bundles/', { params }),
  calculatePrice: (bundleId: number, params: { start_date: string; end_date: string }) =>
    apiFetch(`bundles/bundles/${bundleId}/calculate_price/`, { params }),
};

export const inventoryApi = {
  getItems: (params?: any) => apiFetch('inventory/inventory/', { params }),
  getItem: (id: number) => apiFetch(`inventory/inventory/${id}/`),
  createItem: (data: any) => apiFetch('inventory/inventory/', { method: 'POST', body: data }),
  updateItem: (id: number, data: any) => apiFetch(`inventory/inventory/${id}/`, { method: 'PATCH', body: data }),
  deleteItem: (id: number) => apiFetch(`inventory/inventory/${id}/`, { method: 'DELETE' }),
  getStockAlerts: (params?: any) => apiFetch('inventory/stock-alerts/', { params }),
  getStockAlert: (id: number) => apiFetch(`inventory/stock-alerts/${id}/`),
  createStockAlert: (data: any) => apiFetch('inventory/stock-alerts/', { method: 'POST', body: data }),
  updateStockAlert: (id: number, data: any) => apiFetch(`inventory/stock-alerts/${id}/`, { method: 'PATCH', body: data }),
  deleteStockAlert: (id: number) => apiFetch(`inventory/stock-alerts/${id}/`, { method: 'DELETE' }),
  getStockMovements: (params?: any) => apiFetch('inventory/stock-movements/', { params }),
  getStockMovement: (id: number) => apiFetch(`inventory/stock-movements/${id}/`),
  createStockMovement: (data: any) => apiFetch('inventory/stock-movements/', { method: 'POST', body: data }),
  updateStockMovement: (id: number, data: any) => apiFetch(`inventory/stock-movements/${id}/`, { method: 'PATCH', body: data }),
  deleteStockMovement: (id: number) => apiFetch(`inventory/stock-movements/${id}/`, { method: 'DELETE' }),
};

export const disputesApi = {
  getDisputes: (params?: any) => apiFetch('disputes/', { params }),
  getDispute: (id: number) => apiFetch(`disputes/${id}`),
  createDispute: (data: any) => apiFetch('disputes/create', { method: 'POST', body: data }),
  createDisputeMessage: (disputeId: number, data: any) => apiFetch(`disputes/${disputeId}/messages`, { method: 'POST', body: data }),
  getTickets: (params?: any) => apiFetch('disputes/', { params }),
  getTicket: (id: number) => apiFetch(`disputes/${id}`),
  createTicket: (data: any) => apiFetch('disputes/create', { method: 'POST', body: data }),
  createTicketMessage: (ticketId: number, data: any) => apiFetch(`disputes/${ticketId}/messages`, { method: 'POST', body: data }),
};

export const analyticsApi = {
  trackEvent: (data: any) => apiFetch('analytics/events/', { method: 'POST', body: data }),
  getEvents: (params?: any) => apiFetch('analytics/events/', { params }),
  getDailyAnalytics: (params?: any) => apiFetch('analytics/daily/', { params }),
  getUserBehavior: (params?: any) => apiFetch('analytics/user-behavior/', { params }),
  getProductActivity: (productId: number) => apiFetch(`analytics/live/activity/${productId}/`),
};

export const paymentsApi = {
  getMethods: () => apiFetch('payments/methods/'),
  create: (data: any) => apiFetch('payments/create/', { method: 'POST', body: data }),
  verifyOtp: (id: number, otpCode: string) => apiFetch(`payments/payments/${id}/verify_otp/`, { method: 'POST', body: { otp_code: otpCode } }),
  getEscrowMetrics: () => apiFetch('payments/metrics/'),
};

export const socialApi = {
  vouch: (userId: number) => apiFetch(`social/vouch/${userId}/`, { method: 'POST' }),
  getSocialScore: (userId: number) => apiFetch(`social/score/${userId}/`),
  getFeed: (params?: any) => apiFetch('social/feed/', { params }),
};

export const judicialApi = {
  initiateDispute: (data: any) => apiFetch('v1/judicial/disputes/initiate/', { method: 'POST', body: data }),
  getDisputeStatus: (id: number) => apiFetch(`v1/judicial/disputes/${id}/status/`),
  issueVerdict: (id: number, data: any) => apiFetch(`v1/judicial/disputes/${id}/verdict/`, { method: 'POST', body: data }),
  appealVerdict: (id: number, data: any) => apiFetch(`v1/judicial/disputes/${id}/appeal/`, { method: 'POST', body: data }),
  closeDispute: (id: number) => apiFetch(`v1/judicial/disputes/${id}/close/`, { method: 'POST' }),
  getCaseDetail: (id: number) => apiFetch(`v1/tribunal/cases/${id}/`),
  getPublicLedger: (params?: any) => apiFetch('v1/public/judgments/', { params }),
  getPublicMetrics: () => apiFetch('v1/public/metrics/'),
};

export const intelligenceApi = {
  getMarketReport: (params?: { industry?: string; region?: string }) =>
    apiFetch('analytics/intelligence/report/', { params }),
  getRegionalLiquidity: () => apiFetch('analytics/admin/regional-liquidity/'),
  getPulse: () => apiFetch('analytics/intelligence/pulse/'),
};

export const innovationApi = {
  getArtisans: (params?: any) => apiFetch('artisans/artisans/', { params }),
  getBundles: (params?: any) => apiFetch('bundles/bundles/', { params }),
  getLocalGuideCategories: () => apiFetch('local-guide/categories/'),
};

export const verificationApi = {
  submit: (facePhoto: string) => apiFetch('verification/submit/', { method: 'POST', body: { face_photo: facePhoto } }),
  getStatus: () => apiFetch('verification/status/'),
  getPending: () => apiFetch('verification/pending/'),
  vote: (verificationId: string, vote: 'approve' | 'reject', comment?: string) =>
    apiFetch('verification/vote/', { method: 'POST', body: { verification_id: verificationId, vote, comment } }),
};