// NOTE: Next.js 16 recommends migrating to proxy.ts
// See: https://nextjs.org/docs/messages/middleware-to-proxy
// The middleware file still works but is deprecated.
// TODO: Migrate to proxy.ts when the API stabilizes.
//
// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Middleware (Auth Gate + Security Headers)
// ═══════════════════════════════════════════════════════════════
//
// المسارات المحمية: /dashboard, /wallet, /bookings, /returns,
//                   /verification, /cart, /checkout, /disputes,
//                   /social, /trust-score, /bundles, /contracts,
//                   /vendors/dashboard, /products/create
// المسارات الإدارية:  /admin
//
// آلية العمل:
// 1. التحقق من وجود session_token (cookie أو Authorization header)
// 2. إذا غائب → إعادة توجيه لصفحة الدخول
// 3. التحقق الكامل (HMAC + دور المستخدم) يتم في كل API route
//    عبر getSessionFromRequest() من auth-server.ts
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// ──── Route Definitions ────
const PROTECTED_ROUTES = [
  '/dashboard', '/wallet', '/bookings', '/returns',
  '/verification', '/cart', '/checkout', '/disputes',
  '/social', '/trust-score', '/bundles', '/contracts',
  '/vendors/dashboard', '/products/create',
];

const ADMIN_ROUTES = ['/admin'];

// API routes that skip the middleware gate (they do their own auth)
const API_ROUTE_PREFIX = '/api/';

// Static/auth routes that should never be gated
// NOTE: /products is public BUT /products/create is in PROTECTED_ROUTES
// The protected check runs AFTER public check, so we must exclude
// /products/create from the public blanket match.
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password',
  '/products', '/services', '/artisans', '/blog', '/about',
  '/privacy', '/insurance', '/contact'];

// Routes that must NOT be treated as public even if they
// share a prefix with a PUBLIC_ROUTES entry.
const PROTECTED_OVERRIDES = ['/products/create'];

function extractToken(request: NextRequest): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // 2. Cookie: session_token=<token>
  const cookie = request.cookies.get('session_token');
  return cookie?.value || null;
}

function isPublicPath(pathname: string): boolean {
  // Protected overrides take precedence over public prefixes
  if (PROTECTED_OVERRIDES.some(r => pathname.startsWith(r))) {
    return false;
  }
  // Exact matches for known public pages
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return true;
  }
  // All API routes handle their own auth
  if (pathname.startsWith(API_ROUTE_PREFIX)) {
    return true;
  }
  // Static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/icons') || pathname === '/favicon.ico') {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and API routes (API handles own auth)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = extractToken(request);

  // ──── Admin Routes: require session ────
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Token exists — let the admin API routes verify role
    return NextResponse.next();
  }

  // ──── Protected Routes: require session ────
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Default: allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
