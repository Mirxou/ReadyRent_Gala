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
    apiFetch('auth/forgot-password', { method: 'POST', body: { email } }),
  passwordResetConfirm: (token: string, uid: string, password: string, passwordConfirm: string) =>
    apiFetch('auth/reset-password', { method: 'POST', body: { token, uid, password, password_confirm: passwordConfirm } }),
};

export const productsApi = {
  getAll: (params?: any) => apiFetch('products/', { params }),
  getById: (id: string) => apiFetch(`products/${id}/`),
  getBySlug: (slug: string) => apiFetch(`products/${slug}/`),
  getCategories: () => apiFetch('products/categories/'),
  getSearchSuggestions: (query: string) => apiFetch('products/search-suggestions/', { params: { q: query } }),
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
  addToWaitlist: (data: any) => apiFetch('bookings/waitlist/', { method: 'POST', body: data }),
  removeFromWaitlist: (id: number) => apiFetch(`bookings/waitlist/${id}/`, { method: 'DELETE' }),
};

export const disputesApi = {
  getDisputes: (params?: any) => apiFetch('disputes/', { params }),
  getDispute: (id: string) => apiFetch(`disputes/${id}`),
  createDispute: (data: any) => apiFetch('disputes/create', { method: 'POST', body: data }),
  createDisputeMessage: (id: string, data: any) => apiFetch(`disputes/${id}/messages`, { method: 'POST', body: data }),
  getDisputeHistory: (id: number) => apiFetch(`disputes/${id}/history`),
  getDisputeStatus: (id: number) => apiFetch(`disputes/${id}`),
  getDisputeVerdict: (id: number) => apiFetch(`disputes/${id}`),
};

export const adminApi = {
  getDashboardStats: () => apiFetch('analytics/admin/dashboard/'),
  getRevenue: (params?: { days?: number }) => apiFetch('analytics/admin/revenue/', { params }),
  getDailyAnalyticsSummary: (params?: { days?: number }) => apiFetch('analytics/daily/summary/', { params }),
  getSalesReport: (params?: { days?: number; export?: boolean }) => apiFetch('analytics/admin/sales-report/', { params }),
  getAllUsers: (params?: any) => apiFetch('admin/users/', { params }),
  updateUser: (id: string, data: any) => apiFetch(`admin/users/${id}/`, { method: 'PATCH', body: data }),
  getAllBookings: (params?: any) => apiFetch('admin/bookings/', { params }),
  getBookingStats: () => apiFetch('admin/bookings/stats/'),
  getAllProducts: (params?: any) => apiFetch('products/admin/', { params }),
  createProduct: (data: any) => apiFetch('products/admin/', { method: 'POST', body: data }),
  updateProduct: (id: string, data: any) => apiFetch(`products/admin/${id}/`, { method: 'PUT', body: data }),
  deleteProduct: (id: string) => apiFetch(`products/admin/${id}/`, { method: 'DELETE' }),
};

export const reviewsApi = {
  getAll: (params?: any) => apiFetch('reviews/', { params }),
  create: (data: any) => apiFetch('reviews/create/', { method: 'POST', body: data }),
};

export const chatbotApi = {
  quickChat: (message: string, options?: { language?: string; [key: string]: any }) =>
    apiFetch('chatbot/quick-chat/', { method: 'POST', body: { message, language: options?.language || 'ar', ...options } }),
};

export const bundlesApi = {
  getAll: (params?: any) => apiFetch('bundles/bundles/', { params }),
  calculatePrice: (id: string, params: { start_date: string; end_date: string }) =>
    apiFetch(`bundles/${id}/calculate-price/`, { params }),
};

export const cancellationApi = {
  getPolicy: (bookingId: string) => apiFetch(`bookings/${bookingId}/cancellation-policy/`),
};

export const depositApi = {
  calculateDeposit: (params: { product_id: string; start_date: string; end_date: string }) =>
    apiFetch('bookings/calculate-deposit/', { params }),
};

export const analyticsApi = {
  trackEvent: (data: any) => apiFetch('analytics/events/', { method: 'POST', body: data }),
  getEvents: (params?: any) => apiFetch('analytics/events/', { params }),
  getProductActivity: (productId: number) => apiFetch(`analytics/live/activity/${productId}/`),
};

export const paymentsApi = {
  getMethods: () => apiFetch('payments/methods/'),
  create: (data: any) => apiFetch('payments/create/', { method: 'POST', body: data }),
};

export const socialApi = {
  vouch: (userId: number) => apiFetch(`social/vouch/${userId}/`, { method: 'POST' }),
  getSocialScore: (userId: number) => apiFetch(`social/score/${userId}/`),
  getFeed: (params?: any) => apiFetch('social/feed/', { params }),
};

export const intelligenceApi = {
  getMarketReport: (params?: { industry?: string; region?: string }) =>
    apiFetch('analytics/intelligence/report/', { params }),
};

export const innovationApi = {
  getArtisans: (params?: any) => apiFetch('artisans/artisans/', { params }),
  getBundles: (params?: any) => apiFetch('bundles/bundles/', { params }),
};

export const verificationApi = {
  submit: (facePhoto: string) => apiFetch('verification/submit/', { method: 'POST', body: { face_photo: facePhoto } }),
  getStatus: () => apiFetch('verification/status/'),
  getPending: () => apiFetch('verification/pending/'),
  vote: (verificationId: string, vote: 'approve' | 'reject', comment?: string) =>
    apiFetch('verification/vote/', { method: 'POST', body: { verification_id: verificationId, vote, comment } }),
};