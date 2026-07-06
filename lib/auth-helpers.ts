// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Centralized Auth Helpers
// Replaces scattered localStorage.getItem('access_token') calls
// ═══════════════════════════════════════════════════════════════

/**
 * Get auth token from the correct storage (Zustand persist)
 * Falls back to localStorage.getItem for backward compatibility during transition
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('auth-storage-v2');
    if (stored) {
      const parsed = JSON.parse(stored);
      // In mock mode, generate a token from user data
      if (parsed.state?.user?.id) {
        return `mock-jwt-token-${parsed.state.user.id}`;
      }
    }
  } catch {
    // Storage corrupted or unavailable
  }

  // Fallback (deprecated - will be removed)
  return localStorage.getItem('access_token');
}

/**
 * Get current user info from Zustand persist storage
 */
export function getStoredUser(): { id: number; role: string; username: string } | null {
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
 * Get authorization headers for fetch calls
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}