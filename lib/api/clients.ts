// STUB: green-sweep — original module never landed on main.
// These client objects are imported by live pages/components (social, blog, cms,
// chatbot, artisans, services, bundles, locations, hygiene, deposit) but the
// `clients.ts` module itself was never committed to the repo. This stub restores
// the expected exports on top of the shared apiFetch core so callers compile.
// Runtime shapes are unverified against the backend — every consumer already
// narrows defensively (Array.isArray / 'in' / explicit casts).
import { api } from './core';

interface ClientEnvelope<T = unknown> {
  data: T;
  status: number;
  meta?: unknown;
}

async function get<T>(path: string): Promise<ClientEnvelope<T>> {
  return (await api.get(path)) as ClientEnvelope<T>;
}

async function post<T>(path: string, body?: unknown): Promise<ClientEnvelope<T>> {
  return (await api.post(path, body)) as ClientEnvelope<T>;
}

async function put<T>(path: string, body?: unknown): Promise<ClientEnvelope<T>> {
  return (await api.put(path, body)) as ClientEnvelope<T>;
}

async function del<T>(path: string): Promise<ClientEnvelope<T>> {
  return (await api.delete(path)) as ClientEnvelope<T>;
}

function qs(params?: Record<string, unknown>): string {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ─── Social ───
export interface SocialFeedItem {
  id?: string | number;
  userName?: string | null;
  action?: string | null;
  type?: string | null;
  [key: string]: any;
}

export interface SocialFeedData {
  data?: SocialFeedItem[];
  results?: SocialFeedItem[];
  [key: string]: any;
}

export const socialApi = {
  getFeed: () => get<SocialFeedData>('/social/feed/'),
  getSocialScore: (userId: string) => get<any>(`/social/score/${userId}/`),
};

// ─── Services ───
export interface ServiceItem {
  id: string;
  name_ar?: string | null;
  category_ar?: string | null;
  description_ar?: string | null;
  image?: string | null;
  location?: string | null;
  rating?: number | string | null;
  is_verified?: boolean;
  [key: string]: any;
}

export const servicesApi = {
  getAll: (params?: Record<string, unknown>) =>
    get<ServiceItem[]>(`/services${qs(params)}`),

  book: (data: { serviceId: string | number; date: string; phone: string; notes?: string }) =>
    post<{ message_ar?: string | null; message_en?: string | null; [key: string]: any }>('/services/book/', data),
};

// ─── CMS pages ───
export const cmsApi = {
  getPages: (params?: Record<string, unknown>) => get<any>(`/cms/pages${qs(params)}`),
  getBySlug: (slug: string) => get<any>(`/cms/pages/${slug}/`),
  create: (data: Record<string, unknown>) => post<any>('/cms/pages/', data),
  update: (id: string, data: Record<string, unknown>) => put<any>(`/cms/pages/${id}/`, data),
  delete: (id: string) => del<any>(`/cms/pages/${id}/`),
};

// ─── Chatbot ───
export interface ChatBotReply {
  id?: string | null;
  session_id?: string | null;
  response?: string | null;
  message?: string | null;
  content?: string | null;
  [key: string]: any;
}

export const chatbotApi = {
  createSession: (data?: Record<string, unknown>) => post<ChatBotReply>('/chatbot/sessions/', data),
  sendMessage: (sessionId: string, text: string) =>
    post<ChatBotReply>(`/chatbot/sessions/${sessionId}/messages/`, { message: text }),
  quickChat: (text: string, options?: Record<string, unknown>) =>
    post<ChatBotReply>('/chatbot/quick/', { message: text, ...options }),
};

// ─── Blog ───
export interface BlogPost {
  id?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string | null;
  category?: string;
  created_at?: string;
  read_time?: number | string;
  [key: string]: any;
}

export const blogApi = {
  getAll: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(`/blog/posts${qs(params)}`),
  getById: (id: string) => get<BlogPost>(`/blog/posts/${id}/`),
};

// ─── Artisans ───
export interface ArtisanList {
  results?: Record<string, unknown>[];
  [key: string]: any;
}

export const artisansApi = {
  getAll: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[] | ArtisanList>(`/artisans${qs(params)}`),
};

// ─── Locations / delivery zones ───
export const locationsApi = {
  checkSameDayDelivery: (zoneId: string) =>
    get<{ same_day?: boolean; [key: string]: any }>(`/locations/zones/${zoneId}/check-same-day/`),
};

// ─── Product hygiene certification ───
export const hygieneApi = {
  getLatestForProduct: (productId: string) =>
    get<any>(`/hygiene/products/${productId}/latest/`),
};

// ─── Deposit calculation ───
export const depositApi = {
  calculateDeposit: (params: { product_id: string; start_date: string; end_date: string }) =>
    get<any>(`/products/${params.product_id}/calculate-deposit${qs({
      start_date: params.start_date,
      end_date: params.end_date,
    })}`),
};

// ─── Bundles ───
export const bundlesApi = {
  getAll: () => get<Record<string, unknown>[] | ArtisanList>('/bundles/'),
  calculatePrice: (bundleId: number, params: { start_date: string; end_date: string }) =>
    post<any>(`/bundles/${bundleId}/calculate-price/`, params),
};
