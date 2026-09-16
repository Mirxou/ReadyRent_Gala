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

/** SMS: 3 per hour per IP (SMS bombing prevention) */
export function checkSmsRateLimit(ip: string): RateLimitResult {
  return rateLimit(`sms:${ip}`, 3, 60 * 60 * 1000);
}

/** Create (bookings, disputes, reviews): 20 per minute per IP */
export function checkCreateRateLimit(ip: string): RateLimitResult {
  return rateLimit(`create:${ip}`, 20, 60 * 1000);
}

/** Contact form: 3 per hour per IP (spam prevention) */
export function checkContactRateLimit(ip: string): RateLimitResult {
  return rateLimit(`contact:${ip}`, 3, 60 * 60 * 1000);
}

// ──── P1 fix: pre-configured limiters for previously-unprotected endpoints ────

/**
 * Escrow operations (release/refund): 10 per minute per user
 * Protects against compromised-admin mass-drain attempts.
 */
export function checkEscrowRateLimit(userId: string): RateLimitResult {
  return rateLimit(`escrow:${userId}`, 10, 60 * 1000);
}

/**
 * Verification submissions (face photo 5MB base64): 3 per hour per user
 * Prevents DB-growth DoS via repeated 5MB photo submissions.
 */
export function checkVerificationSubmitRateLimit(userId: string): RateLimitResult {
  return rateLimit(`verification-submit:${userId}`, 3, 60 * 60 * 1000);
}

/**
 * Verification votes: 30 per minute per user (community review queue)
 * Allows active participation but blocks automated mass-voting.
 */
export function checkVerificationVoteRateLimit(userId: string): RateLimitResult {
  return rateLimit(`verification-vote:${userId}`, 30, 60 * 1000);
}

/**
 * Admin mutations (role change, user update, etc.): 30 per minute per admin
 * Slows down a compromised-admin mass-escalation attempt.
 */
export function checkAdminMutationRateLimit(userId: string): RateLimitResult {
  return rateLimit(`admin-mutation:${userId}`, 30, 60 * 1000);
}

/**
 * Per-email rate limit for forgot-password (P2-33 fix).
 * 3 requests per hour per email — prevents an attacker with multiple IPs
 * from spamming a single victim with reset emails.
 */
export function checkForgotPasswordRateLimit(email: string): RateLimitResult {
  // Normalize to lowercase so attackers can't bypass via case variation
  return rateLimit(`forgotpw:${email.toLowerCase()}`, 3, 60 * 60 * 1000);
}

// ──── Request body size limit (DoS prevention) ────

/**
 * Read and validate request body size.
 * P2-43 fix: previously read the entire body into memory before checking
 * the length — a malicious 1GB body would consume 1GB of memory before
 * being rejected. Now we abort the read as soon as we exceed maxBytes.
 *
 * Strategy: pull chunks from the ReadableStream and concatenate until
 * either the stream ends or we've accumulated more than maxBytes.
 * If we exceed, we cancel the stream and return 413.
 *
 * @param request - The Request object
 * @param maxBytes - Maximum allowed body size in bytes (default 100KB)
 * @returns Object with `text` if valid, or `error` object if too large
 */
export async function readValidatedBody(
  request: Request,
  maxBytes = 100_000
): Promise<{ text: string } | { error: true; status: 413; code: string; message_ar: string; message_en: string }> {
  // If the request advertises a Content-Length we can short-circuit before
  // reading anything.
  const declaredLength = request.headers.get('content-length');
  if (declaredLength) {
    const n = parseInt(declaredLength, 10);
    if (Number.isFinite(n) && n > maxBytes) {
      return {
        error: true,
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message_ar: 'بيانات كبيرة جداً',
        message_en: 'Request body too large',
      };
    }
  }

  // Streaming read with early abort
  if (!request.body) {
    return { text: '' };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let acc = '';
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // value is a Uint8Array chunk
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        // Cancel the stream so the producer stops sending
        await reader.cancel();
        return {
          error: true,
          status: 413,
          code: 'PAYLOAD_TOO_LARGE',
          message_ar: 'بيانات كبيرة جداً',
          message_en: 'Request body too large',
        };
      }
      // Decode + accumulate. NOTE: this still keeps the whole body in memory
      // up to maxBytes, which is fine — the limit IS the cap.
      acc += decoder.decode(value, { stream: true });
    }
    // Flush the decoder
    acc += decoder.decode();
  } finally {
    try { reader.releaseLock(); } catch { /* noop */ }
  }

  return { text: acc };
}

// ──── IP extraction helper ────
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
