import { NextRequest, NextResponse } from 'next/server';
import { checkGeneralRateLimit, getClientIp } from '@/lib/rate-limiter';


// ═══════════════════════════════════════════════════════════════════
// STANDARD.Rent — API Gateway
// Clean proxy layer — no mock data. Returns 501 for known endpoints
// that don't have a real backend yet, and 404 for unknown paths.
// ═══════════════════════════════════════════════════════════════════

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

// getQueryParams reserved for future use
// function getQueryParams(request: NextRequest): Record<string, string> {
//   const url = new URL(request.url, 'http://localhost');
//   const params: Record<string, string> = {};
//   url.searchParams.forEach((v, k) => {
//     params[k] = v;
//   });
//   return params;
// }

// ═══════════════════════════════════════════════════════════════════
// Known API prefix patterns (return 501 instead of 404)
// ═══════════════════════════════════════════════════════════════════
const KNOWN_PREFIXES = [
  'auth/',
  'products/',
  'bookings/',
  'analytics/',
  'bundles/',
  'chatbot/',
  'disputes/',
  'payments/',
  'social/',
  'artisans/',
  'vendors/',
  'reviews/',
  'insurance/',
  'wallet/',
  'notifications/',
  'contracts/',
  'returns/',
  'subscriptions/',
  'verification/',
  'blog/',
  'cms/',
  'contact/',
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
  const clientIp = getClientIp(request);

  // Rate limiting
  if (!checkGeneralRateLimit(clientIp).allowed) {
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
  const clientIp = getClientIp(request);

  // Rate limiting
  if (!checkGeneralRateLimit(clientIp).allowed) {
    return rateLimitedResponse();
  }

  if (isKnownEndpoint(path)) {
    return notImplemented(path, 'POST');
  }

  return notFound(path);
}

export async function PUT(request: NextRequest) {
  const path = normPath(request.nextUrl.pathname.replace('/api/', ''));
  const clientIp = getClientIp(request);

  // Rate limiting
  if (!checkGeneralRateLimit(clientIp).allowed) {
    return rateLimitedResponse();
  }

  if (isKnownEndpoint(path)) {
    return notImplemented(path, 'PUT');
  }

  return notFound(path);
}

export async function PATCH(request: NextRequest) {
  const path = normPath(request.nextUrl.pathname.replace('/api/', ''));
  const clientIp = getClientIp(request);

  // Rate limiting
  if (!checkGeneralRateLimit(clientIp).allowed) {
    return rateLimitedResponse();
  }

  if (isKnownEndpoint(path)) {
    return notImplemented(path, 'PATCH');
  }

  return notFound(path);
}

export async function DELETE(request: NextRequest) {
  const path = normPath(request.nextUrl.pathname.replace('/api/', ''));
  const clientIp = getClientIp(request);

  // Rate limiting
  if (!checkGeneralRateLimit(clientIp).allowed) {
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