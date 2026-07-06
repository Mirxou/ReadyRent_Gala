// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Centralized Auth Helpers
// Client-side token retrieval for API Authorization headers
// ═══════════════════════════════════════════════════════════════

/**
 * Get auth token from localStorage.
 * The real session is managed via HttpOnly cookie (set by /api/auth/login),
 * but we also store the token in localStorage for explicit Bearer header
 * usage in scenarios where cookies aren't sent (e.g., cross-origin).
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // Primary: read session token from localStorage (set by login flow)
    const token = localStorage.getItem('session-token');
    if (token) return token;
  } catch {
    // Storage unavailable
  }

  return null;
}

/**
 * Get current user info from Zustand persist storage
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
    // Storage corrupted
  }

  return null;
}

/**
 * Check if user is authenticated
 */
export function isUserAuthenticated(): boolean {
  return !!getStoredUser();
}

/**
 * Check if user has admin role
 */
export function isAdminUser(): boolean {
  const user = getStoredUser();
  return user?.role === 'admin';
}

/**
 * Get authorization headers for fetch calls.
 * Includes Bearer token if available in localStorage.
 * Cookies (HttpOnly) are sent automatically by the browser.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}