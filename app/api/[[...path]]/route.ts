import { NextRequest, NextResponse } from 'next/server';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════════════════
// STANDARD.Rent — API Gateway
// Clean proxy layer — no mock data. Returns 501 for known endpoints
// that don't have a real backend yet, and 404 for unknown paths.
// ═══════════════════════════════════════════════════════════════════

// ──── In-Memory Rate Limiter ────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // per window (general)
const AUTH_RATE_LIMIT_MAX = 5; // stricter for auth endpoints

function rateLimit(key: string, max: number = RATE_LIMIT_MAX): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// ──── Auth Helper ────
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAuthenticated(request: NextRequest): boolean {
  return !!getAuthToken(request);
}

// ──── Response Helpers ────

function sovereignWrap(data: unknown, meta?: Record<string, unknown>) {
  const response: Record<string, unknown> = {
    success: true,
    dignity_preserved: true,
    data,
  };
  if (meta) response.meta = meta;
  return response;
}

function notImplemented(endpoint: string, method: string) {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: `النقطة ${method} ${endpoint} غير متاحة حالياً — قيد التطوير`,
      message_en: `Endpoint ${method} ${endpoint} not yet implemented — under development`,
      code: 'NOT_IMPLEMENTED',
    },
    { status: 501 }
  );
}

function notFound(path: string) {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: `المسار غير موجود: ${path}`,
      message_en: `Path not found: ${path}`,
      code: 'NOT_FOUND',
    },
    { status: 404 }
  );
}

function rateLimitedResponse() {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: 'تم تجاوز حد الطلبات. حاول مرة أخرى لاحقاً.',
      message_en: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMITED',
    },
    { status: 429 }
  );
}

/** Normalize path: strip leading/trailing slashes, collapse doubles */
function normPath(raw: string): string {
  return raw.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
}

/** Extract query params from full URL */
function getQueryParams(request: NextRequest): Record<string, string> {
  const url = new URL(request.url, 'http://localhost');
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  return params;
}

// ═══════════════════════════════════════════════════════════════════
// Known API prefix patterns (return 501 instead of 404)
// ═══════════════════════════════════════════════════════════════════
const KNOWN_PREFIXES = [
  'auth/',
  'products/',
  'bookings/',
  'analytics/',
  'maintenance/',
  'hygiene/',
  'locations/',
  'packaging/',
  'chatbot/',
  'bundles/',
  'inventory/',
  'disputes/',
  'payments/',
  'social/',
  'v1/judicial/',
  'v1/tribunal/',
  'v1/public/',
  'artisans/',
  'vendors/',
  'reviews/',
  'local-guide/',
  'insurance/',
  'wallet/',
  'notifications/',
  'contracts/',
  'returns/',
  'subscriptions/',
  'verification/',
  'cart/',
  'checkout/',
  'search/',
];

function isKnownEndpoint(path: string): boolean {
  if (path === 'health' || path === 'health/') return true;
  return KNOWN_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// ═══════════════════════════════════════════════════════════════════
// Health endpoint (the only one that works without a real backend)
// ═══════════════════════════════════════════════════════════════════
function handleHealth() {
  return NextResponse.json(
    sovereignWrap({ status: 'sovereign_proceeding', code: 'SYSTEM_NOMINAL' })
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Handlers
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const path = normPath(request.nextUrl.pathname.replace('/api/', ''));
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Rate limiting
  if (!rateLimit(clientIp)) {
    return rateLimitedResponse();
  }

  // Health check
  if (path === 'health' || path === 'health/') {
    return handleHealth();
  }

  // Known endpoint → 501 Not Implemented
  if (isKnownEndpoint(path)) {
    return notImplemented(path, 'GET');
  }

  // Unknown endpoint → 404
  return notFound(path);
}

export async function POST(request: NextRequest) {
  const path = normPath(request.nextUrl.pathname.replace('/api/', ''));
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Stricter rate limiting for POST
  const isAuth = path.startsWith('auth/');
  if (!rateLimit(clientIp, isAuth ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX)) {
    return rateLimitedResponse();
  }

  if (isKnownEndpoint(path)) {
    return notImplemented(path, 'POST');
  }

  return notFound(path);
}

export async function PUT(request: NextRequest) {
  const path = normPath(request.nextUrl.pathname.replace('/api/', ''));
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  if (!rateLimit(clientIp)) {
    return rateLimitedResponse();
  }

  if (isKnownEndpoint(path)) {
    return notImplemented(path, 'PUT');
  }

  return notFound(path);
}

export async function PATCH(request: NextRequest) {
  const path = normPath(request.nextUrl.pathname.replace('/api/', ''));
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  if (!rateLimit(clientIp)) {
    return rateLimitedResponse();
  }

  if (isKnownEndpoint(path)) {
    return notImplemented(path, 'PATCH');
  }

  return notFound(path);
}

export async function DELETE(request: NextRequest) {
  const path = normPath(request.nextUrl.pathname.replace('/api/', ''));
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  if (!rateLimit(clientIp)) {
    return rateLimitedResponse();
  }

  if (isKnownEndpoint(path)) {
    return notImplemented(path, 'DELETE');
  }

  return notFound(path);
}

// Handle all other HTTP methods
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}