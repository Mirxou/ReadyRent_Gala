import { apiFetch } from './core';

// ═══════════════════════════════════════════════════════════════════
// API Endpoint Objects — migrated from monolith lib/api.ts
// These APIs exist ONLY here, not in any sub-module.
// ═══════════════════════════════════════════════════════════════════

export const chatbotApi = {
  quickChat: (message: string, options?: { language?: string; [key: string]: unknown }) =>
    apiFetch('chatbot/quick-chat', { method: 'POST', body: { message, language: options?.language || 'ar', ...options } }),
  chat: (message: string, sessionId: string, language: string = 'ar') =>
    apiFetch('chatbot/chat', { method: 'POST', body: { message, sessionId, language } }),
  createSession: (options?: { language?: string }) =>
    apiFetch('chatbot/chat', { method: 'POST', body: { message: '', sessionId: crypto.randomUUID(), language: options?.language || 'ar' } }),
  sendMessage: (sessionId: string, message: string) =>
    apiFetch('chatbot/chat', { method: 'POST', body: { message, sessionId, language: 'ar' } }),
};

export const bundlesApi = {
  getAll: (params?: Record<string, unknown>) => apiFetch('bundles/bundles', { params }),
  getById: (id: string) => apiFetch(`bundles/${id}`),
  calculatePrice: (id: string, params: { start_date: string; end_date: string }) =>
    apiFetch(`bundles/${id}/calculate-price`, { params }),
  book: (id: string, data: Record<string, unknown>) => apiFetch(`bundles/${id}/book`, { method: 'POST', body: data }),
};

export const cancellationApi = {
  getPolicy: (bookingId: string) => apiFetch(`bookings/${bookingId}/cancellation-policy`),
};

export const depositApi = {
  calculateDeposit: (params: { product_id: string; start_date: string; end_date: string }) =>
    apiFetch('bookings/calculate-deposit', { params }),
};

export const analyticsApi = {
  trackEvent: (data: Record<string, unknown>) => apiFetch('analytics/events', { method: 'POST', body: data }),
  getEvents: (params?: Record<string, unknown>) => apiFetch('analytics/events', { params }),
  getProductActivity: (productId: string) => apiFetch(`analytics/live/activity/${productId}`),
  getUserBehavior: (params?: Record<string, unknown>) => apiFetch('analytics/daily/summary', { params }),
  getDailyAnalytics: (params?: { days?: number }) => apiFetch('analytics/daily/summary', { params }),
};

export const socialApi = {
  vouch: (userId: string) => apiFetch(`social/vouch/${userId}`, { method: 'POST' }),
  getSocialScore: (userId: string) => apiFetch(`social/score/${userId}`),
  getFeed: (params?: Record<string, unknown>) => apiFetch('social/feed', { params }),
};

// ──── الأنظمة المساندة ────

export const artisansApi = {
  getAll: (params?: Record<string, unknown>) => apiFetch('artisans/artisans', { params }),
};

export const vendorsApi = {
  getAll: (params?: Record<string, unknown>) => apiFetch('vendors/vendors', { params }),
  getDashboard: () => apiFetch('vendors/dashboard'),
};

export const servicesApi = {
  getAll: (params?: Record<string, unknown>) => apiFetch('services', { params }),
  getCategories: () => apiFetch('services/categories'),
  book: (data: Record<string, unknown>) => apiFetch('services/book', { method: 'POST', body: data }),
};

export const returnsApi = {
  getAll: (params?: Record<string, unknown>) => apiFetch('returns', { params }),
  create: (data: Record<string, unknown>) => apiFetch('returns/create', { method: 'POST', body: data }),
};

export const insuranceApi = {
  getAll: () => apiFetch('insurance'),
  purchase: (data: Record<string, unknown>) => apiFetch('insurance/purchase', { method: 'POST', body: data }),
};

export const subscriptionsApi = {
  getAll: () => apiFetch('subscriptions'),
  subscribe: (data: Record<string, unknown>) => apiFetch('subscriptions/subscribe', { method: 'POST', body: data }),
  cancel: (planId: string) => apiFetch('subscriptions/cancel', { method: 'POST', body: { planId } }),
};

export const blogApi = {
  getAll: (params?: Record<string, unknown>) => apiFetch('blog', { params }),
  getById: (id: string) => apiFetch(`blog/${id}`),
  getBySlug: (slug: string) => apiFetch(`blog/${slug}`),
};

export const cmsApi = {
  getPages: (params?: Record<string, unknown>) => apiFetch('cms/pages', { params }),
  getBySlug: (slug: string) => apiFetch(`cms/pages/${slug}`),
  create: (data: Record<string, unknown>) => apiFetch('cms/pages', { method: 'POST', body: data }),
  update: (id: string, data: Record<string, unknown>) => apiFetch(`cms/pages/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiFetch(`cms/pages/${id}`, { method: 'DELETE' }),
};

export const contactApi = {
  submit: (data: Record<string, unknown>) => apiFetch('contact', { method: 'POST', body: data }),
};

// ═══════════════════════════════════════════════════════════════════
// NEW APIs — previously broken imports (did not exist anywhere)
// ═══════════════════════════════════════════════════════════════════

export const hygieneApi = {
  getRecords: () => apiFetch('hygiene'),
  getLatestForProduct: (productId: string) => apiFetch(`hygiene/product/${productId}`),
  createRecord: (data: Record<string, unknown>) => apiFetch('hygiene', { method: 'POST', body: data }),
  updateRecord: (id: string, data: Record<string, unknown>) => apiFetch(`hygiene/${id}`, { method: 'PUT', body: data }),
  deleteRecord: (id: string) => apiFetch(`hygiene/${id}`, { method: 'DELETE' }),
};

export const inventoryApi = {
  getItems: () => apiFetch('inventory'),
  getStockAlerts: () => apiFetch('inventory/alerts'),
  createItem: (data: Record<string, unknown>) => apiFetch('inventory', { method: 'POST', body: data }),
  updateItem: (id: string, data: Record<string, unknown>) => apiFetch(`inventory/${id}`, { method: 'PUT', body: data }),
  deleteItem: (id: string) => apiFetch(`inventory/${id}`, { method: 'DELETE' }),
};

export const packagingApi = {
  getTypes: () => apiFetch('packaging/types'),
  getMaterials: () => apiFetch('packaging/materials'),
  getRules: () => apiFetch('packaging/rules'),
  getInstances: () => apiFetch('packaging/instances'),
  createType: (data: Record<string, unknown>) => apiFetch('packaging/types', { method: 'POST', body: data }),
  updateType: (id: string, data: Record<string, unknown>) => apiFetch(`packaging/types/${id}`, { method: 'PUT', body: data }),
  deleteType: (id: string) => apiFetch(`packaging/types/${id}`, { method: 'DELETE' }),
  createMaterial: (data: Record<string, unknown>) => apiFetch('packaging/materials', { method: 'POST', body: data }),
  updateMaterial: (id: string, data: Record<string, unknown>) => apiFetch(`packaging/materials/${id}`, { method: 'PUT', body: data }),
  deleteMaterial: (id: string) => apiFetch(`packaging/materials/${id}`, { method: 'DELETE' }),
  createRule: (data: Record<string, unknown>) => apiFetch('packaging/rules', { method: 'POST', body: data }),
  updateRule: (id: string, data: Record<string, unknown>) => apiFetch(`packaging/rules/${id}`, { method: 'PUT', body: data }),
  deleteRule: (id: string) => apiFetch(`packaging/rules/${id}`, { method: 'DELETE' }),
};

export const maintenanceApi = {
  getRecords: () => apiFetch('maintenance'),
  createRecord: (data: Record<string, unknown>) => apiFetch('maintenance', { method: 'POST', body: data }),
  updateRecord: (id: string, data: Record<string, unknown>) => apiFetch(`maintenance/${id}`, { method: 'PUT', body: data }),
  deleteRecord: (id: string) => apiFetch(`maintenance/${id}`, { method: 'DELETE' }),
};
