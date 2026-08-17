// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — In-Memory Rate Limiter
// Sliding window rate limiting for auth and payment endpoints
// ═══════════════════════════════════════════════════════════════

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < 3600000); // 1 hour
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

/**
 * Sliding window rate limiter.
 * @param key - Unique identifier (usually IP or userId)
 * @param maxAttempts - Max requests in the window
 * @param windowMs - Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

  if (entry.timestamps.length >= maxAttempts) {
    // Calculate when the oldest request in the window will expire
    const oldest = entry.timestamps[0];
    const retryAfterMs = oldest + windowMs - now;
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  entry.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

// ──── Pre-configured limiters ────

/** Login: 5 attempts per 15 minutes per IP */
export function checkLoginRateLimit(ip: string): RateLimitResult {
  return rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
}

/** Register: 3 attempts per 60 minutes per IP */
export function checkRegisterRateLimit(ip: string): RateLimitResult {
  return rateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
}

/** Payment: 10 per minute per userId */
export function checkPaymentRateLimit(userId: string): RateLimitResult {
  return rateLimit(`payment:${userId}`, 10, 60 * 1000);
}

/** Wallet: 20 per minute per userId */
export function checkWalletRateLimit(userId: string): RateLimitResult {
  return rateLimit(`wallet:${userId}`, 20, 60 * 1000);
}

/** General API: 60 per minute per IP */
export function checkGeneralRateLimit(ip: string): RateLimitResult {
  return rateLimit(`general:${ip}`, 60, 60 * 1000);
}

// ──── IP extraction helper ────
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
