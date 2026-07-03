// Sovereign API Client - connects to Django backend
import { SovereignResponse } from '@/types/sovereign';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Extended options type that supports query params (compatible with fetch RequestInit)
interface SovereignRequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  body?: BodyInit | null;
}

export class SovereignClient {
  public async request<T>(
    endpoint: string,
    options?: SovereignRequestOptions
  ): Promise<SovereignResponse<T>> {
    // Build URL with optional query params
    let path = endpoint.startsWith('http') ? endpoint : `${API_BASE}/api${endpoint}`;
    if (options?.params) {
      const qs = new URLSearchParams();
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) qs.append(k, String(v));
      });
      const qStr = qs.toString();
      if (qStr) path += (path.includes('?') ? '&' : '?') + qStr;
    }

    // Strip params from RequestInit before passing to fetch
    const { params: _params, ...fetchOptions } = options ?? {};

    try {
      const response = await fetch(path, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        credentials: 'include', // for cookies/JWT
      });

      // Check if system is halted (503 Service Unavailable)
      if (response.status === 503) {
        return {
          status: 'sovereign_halt',
          code: 'SYSTEM_HALT',
          dignity_preserved: true,
          message_ar: 'النظام متوقف مؤقتاً للصيانة',
          message_en: 'System temporarily halted for maintenance',
          data: null as unknown as T,
        };
      }

      // Handle 204 No Content (e.g. DELETE success)
      if (response.status === 204) {
        return {
          status: 'sovereign_proceeding',
          code: 'RESOLUTION_DELIVERED',
          dignity_preserved: true,
          message_ar: 'تمت العملية بنجاح',
          message_en: 'Operation successful',
          data: {} as T,
        };
      }

      const data = await response.json();

      // Warn if backend response doesn't follow sovereign spec
      if (data && typeof data === 'object' && !('dignity_preserved' in data)) {
        console.warn('⚠️ Response might be missing dignity_preserved flag!', path);
      }

      return data;
    } catch (error) {
      // Use warn instead of error to avoid Next.js treating this as a build failure
      // during static generation when backend is unavailable
      console.warn('Sovereign Client: Connection unavailable:', (error as Error)?.message ?? error);
      return {
        status: 'sovereign_halt',
        code: 'SYSTEM_HALT',
        dignity_preserved: true,
        message_ar: 'خطأ في الاتصال بالنظام',
        message_en: 'Connection error',
        data: null as unknown as T,
      };
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: SovereignRequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: SovereignRequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: SovereignRequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: SovereignRequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: SovereignRequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * System status check — used by SovereignContext to detect sovereign_halt
   */
  async getSystemStatus() {
    return this.get<{ status: string; code?: string }>('/health/');
  }
}

export const sovereignClient = new SovereignClient();
