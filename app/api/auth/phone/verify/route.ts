// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Phone Verification Verify API Route
// POST /api/auth/phone/verify — accepts { phone, code }
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyPhoneCode } from '@/lib/social-auth';
import { logger } from '@/lib/logger';
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    // ── Rate limiting ──
    const clientIp = getClientIp(request);
    const rateCheck = checkLoginRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'محاولات كثيرة جداً. حاول بعد قليل.',
          message_en: 'Too many attempts. Please try again later.',
          code: 'RATE_LIMITED',
          retry_after_ms: rateCheck.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone, code } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رقم الهاتف مطلوب',
          message_en: 'Phone number is required',
          code: 'MISSING_PHONE',
        },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رمز التحقق مطلوب',
          message_en: 'Verification code is required',
          code: 'MISSING_CODE',
        },
        { status: 400 }
      );
    }

    const result = await verifyPhoneCode(phone, code);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
          message_en: 'Invalid or expired verification code',
          code: 'VERIFICATION_FAILED',
        },
        { status: 401 }
      );
    }

    logger.info('Auth/Phone/Verify', 'Phone verified', { phone });

    return NextResponse.json(
      { success: true, dignity_preserved: true },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Auth/Phone/Verify', 'Error verifying code', error);
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
