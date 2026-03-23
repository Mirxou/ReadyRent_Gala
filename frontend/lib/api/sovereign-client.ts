// Sovereign API Client - connects to Django backend
import { SovereignResponse, DisputeStatus, MediationOffer } from '@/types/sovereign';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class SovereignClient {
  public async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<SovereignResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}/api${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
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

      // Handle raw response if JSON is not possible (e.g. 204 No Content)
      if (response.status === 204) {
        return {
          status: 'success',
          code: 'NO_CONTENT',
          dignity_preserved: true,
          message_ar: 'تمت العملية بنجاح',
          message_en: 'Operation successful',
          data: {} as T,
        };
      }

      const data = await response.json();

      // Enforce dignity_preserved flag
      if (data && typeof data === 'object' && !('dignity_preserved' in data)) {
        // Some endpoints might not be fully sovereign-compliant yet, warn but don't crash
        console.warn('⚠️ Response might be missing dignity_preserved flag!', url);
      }

      return data;
    } catch (error) {
      console.error("Sovereign Client Error:", error);
      // Return a safe error response
      return {
        status: 'error',
        code: 'CONNECTION_ERROR',
        dignity_preserved: true,
        message_ar: 'خطأ في الاتصال بالنظام',
        message_en: 'Connection error',
        data: null as unknown as T
      };
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const sovereignClient = new SovereignClient();
