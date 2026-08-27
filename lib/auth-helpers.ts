// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Centralized Auth Helpers (Client-Side)
// ═══════════════════════════════════════════════════════════════
//
// الأمان: التوكن في HttpOnly cookie فقط — لا localStorage.
// هذه الدوال تقرأ فقط البيانات الوصفية (metadata) من Zustand persist
// لإدارة واجهة المستخدم (UI state). المصادقة الحقيقية عبر cookie.
// ═══════════════════════════════════════════════════════════════

/**
 * Get current user info from Zustand persist storage.
 * This is NON-SENSITIVE metadata (id, role, username) used only for:
 * - UI rendering (show/hide elements based on role)
 * - WebSocket room joining (userId passed to notifications service)
 *
 * NEVER use this for authorization decisions — server validates the cookie.
 */
export function getStoredUser(): { id: string; role: string; username: string } | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('auth-storage-v2');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.user) {
        return {
          id: parsed.state.user.id,
          role: parsed.state.user.role,
          username: parsed.state.user.username,
        };
      }
    }
  } catch {
    // Storage corrupted or unavailable
  }

  return null;
}

/**
 * Check if user appears authenticated (UI-only check).
 * Server-side cookie validation is the real auth gate.
 */
export function isUserAuthenticated(): boolean {
  return !!getStoredUser();
}

/**
 * Get CSRF token from sessionStorage.
 * Generated per session, matches the Double Submit Cookie pattern
 * used by apiFetch in lib/api/core.ts.
 */
function getCsrfToken(): string {
  if (typeof window === 'undefined') return '';
  let token = sessionStorage.getItem('csrf-token');
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem('csrf-token', token);
  }
  return token;
}

/**
 * Get auth headers for raw fetch() calls.
 *
 * Auth is via HttpOnly cookie (sent automatically for same-origin requests).
 * This returns the CSRF token header needed for mutation requests (POST/PUT/PATCH/DELETE)
 * to prevent Cross-Site Request Forgery. Safe to spread into any fetch headers.
 *
 * Used by admin pages and components that use raw fetch() instead of sovereignClient/api.
 */
export function getAuthHeaders(): Record<string, string> {
  return { 'X-CSRF-Token': getCsrfToken() };
}

/**
 * Check if user appears to have admin role (UI-only check).
 * Server-side role validation happens in API routes.
 */
export function isAdminUser(): boolean {
  const user = getStoredUser();
  return user?.role === 'admin';
}
