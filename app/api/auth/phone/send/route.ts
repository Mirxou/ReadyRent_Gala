// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Phone Verification Send API Route
// POST /api/auth/phone/send — accepts { phone }
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { sendPhoneVerification } from '@/lib/social-auth';
import { logger } from '@/lib/logger';
import { checkSmsRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    // ── Rate limiting ──
    const clientIp = getClientIp(request);
    const rateCheck = checkSmsRateLimit(clientIp);
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
    const { phone } = body;

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

    const result = await sendPhoneVerification(phone);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'إرسال رمز التحقق غير متاح حالياً',
          message_en: 'Phone verification is not available at this time',
          code: 'SMS_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    logger.info('Auth/Phone/Send', 'Verification code sent', { phone });

    return NextResponse.json(
      { success: true, dignity_preserved: true, message_id: result.messageId },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Auth/Phone/Send', 'Error sending verification', error);
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
