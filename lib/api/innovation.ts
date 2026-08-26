/* eslint-disable @typescript-eslint/no-explicit-any */

async function apiFetch(
  path: string,
  options: { method?: string; body?: any; params?: Record<string, any> } = {},
): Promise<{ data: any; status: number }> {
  let url = `/api/${path.replace(/^\/+/, '')}`;
  if (options.params) {
    const qs = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    });
    const qStr = qs.toString();
    if (qStr) url += (url.includes('?') ? '&' : '?') + qStr;
  }
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });
  if (res.status === 204) return { data: { success: true }, status: 204 };
  const json = await res.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return { data: json.data, status: res.status };
  }
  return { data: json, status: res.status };
}

export const innovationApi = {
  getArtisans: (params?: any) => apiFetch('artisans/artisans/', { params }),
  getBundles: (params?: any) => apiFetch('bundles/bundles/', { params }),
};