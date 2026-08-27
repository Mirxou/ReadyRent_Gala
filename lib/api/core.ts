/* eslint-disable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════════════
// STANDARD.Rent — Sovereign Unified API Client
// Auth: HttpOnly cookie sent automatically via credentials: 'include'.
// No localStorage tokens — cookie-only for XSS prevention.
// ═══════════════════════════════════════════════════════════════════

// ──── CSRF Token (Double Submit Cookie pattern) ────
// Generated per session, sent as header on mutations.
// Server must validate it matches the cookie value.
function getCsrfToken(): string {
  if (typeof window === 'undefined') return '';
  let token = sessionStorage.getItem('csrf-token');
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem('csrf-token', token);
  }
  return token;
}

// ──── Core Fetch Helper ────
// Returns { data, status, meta } to be compatible with axios response pattern
// that components use: `const res = await api.get(...); const d = res.data;`

export async function apiFetch(
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
    // Silently fail — toasts shown by callers using server error messages
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
