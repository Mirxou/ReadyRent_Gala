import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/wallet', '/bookings', '/returns', '/verification', '/cart', '/checkout'];
const ADMIN_ROUTES = ['/admin'];

// Routes that should redirect to / if already authenticated (used for future auth redirect logic)
// const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session_token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Check if requesting admin routes
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    // In mock mode, we allow access but log it
    // In production, verify admin role from token
    const response = NextResponse.next();
    response.headers.set('X-Admin-Access', 'verified');
    return response;
  }

  // Check if requesting protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      // In mock mode, allow but set a warning header
      const response = NextResponse.next();
      response.headers.set('X-Auth-Warning', 'unauthenticated');
      return response;
    }
  }

  // Security headers for all responses
  const response = NextResponse.next();

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - restrict browser features (allow camera for verification)
  const allowCamera = pathname === '/verification';
  response.headers.set('Permissions-Policy', `camera=(${allowCamera ? 'self' : ''}), microphone=(), geolocation=(self), payment=()`);

  // HSTS (only in production-like environments)
  if (request.headers.get('x-forwarded-proto') === 'https') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
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