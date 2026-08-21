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
 * Check if user appears to have admin role (UI-only check).
 * Server-side role validation happens in API routes.
 */
export function isAdminUser(): boolean {
  const user = getStoredUser();
  return user?.role === 'admin';
}
