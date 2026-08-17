// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Auth Register API Route
// POST /api/auth/register/
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession, formatUserResponse } from '@/lib/auth-server';
import { registerSchema, validateBody } from '@/lib/validators';
import { logger } from '@/lib/logger';
import { checkRegisterRateLimit, getClientIp } from '@/lib/rate-limiter';

const SEVEN_DAYS = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting: 3 attempts per 60 min per IP ──
    const clientIp = getClientIp(request);
    const rateCheck = checkRegisterRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'محاولات تسجيل كثيرة. حاول بعد ساعة.',
          message_en: 'Too many registration attempts. Please try again in an hour.',
          code: 'RATE_LIMITED',
          retry_after_ms: rateCheck.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // ── Zod validation ──
    const vResult = validateBody(registerSchema, body);
    if (!vResult.success) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: vResult.message, message_en: vResult.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { email, password, username, first_name, last_name, phone, role } = vResult.data;

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'هذا البريد الإلكتروني مسجل مسبقاً',
          message_en: 'This email is already registered',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      );
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await db.user.findFirst({ where: { username } });
      if (existingUsername) {
        return NextResponse.json(
          {
            success: false,
            dignity_preserved: true,
            message_ar: 'اسم المستخدم مستخدم مسبقاً',
            message_en: 'Username is already taken',
            code: 'USERNAME_EXISTS',
          },
          { status: 409 }
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in DB
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        username: username || null,
        firstName: first_name || null,
        lastName: last_name || null,
        phone: phone || null,
        role: role ?? 'customer',
      },
    });

    // Create session
    const token = await createSession(user.id);

    // Build response with Set-Cookie
    const response = NextResponse.json(
      {
        success: true,
        dignity_preserved: true,
        data: {
          user: formatUserResponse(user),
        },
      },
      { status: 201 }
    );

    // Set HttpOnly session cookie
    response.cookies.set('session_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SEVEN_DAYS,
    });

    return response;
  } catch (error) {
    logger.error('Auth/Register', 'Registration error', error);
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