// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Google OAuth API Route
// POST /api/auth/google — accepts { code }, calls googleAuth
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { googleAuth } from '@/lib/social-auth';
import { logger } from '@/lib/logger';
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  // Rate limit: 5 per 15 minutes per IP (OAuth abuse prevention)
  const ip = getClientIp(request);
  const rateCheck = checkLoginRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'طلبات كثيرة جداً', message_en: 'Too many requests', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رمز التفويض مطلوب',
          message_en: 'Authorization code is required',
          code: 'MISSING_CODE',
        },
        { status: 400 }
      );
    }

    const result = await googleAuth(code);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'تسجيل الدخول عبر Google غير متاح حالياً',
          message_en: 'Google login is not available at this time',
          code: result.error || 'AUTH_FAILED',
        },
        { status: 503 }
      );
    }

    // ── Future: find or create user, create session, return user data ──

    return NextResponse.json(
      { success: true, dignity_preserved: true, user: result.user },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Auth/Google', 'Google OAuth error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ داخلي في الخادم',
        message_en: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
