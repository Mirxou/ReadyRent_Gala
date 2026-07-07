// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Auth Login API Route
// POST /api/auth/login/
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, formatUserResponse } from '@/lib/auth-server';

const SEVEN_DAYS = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'البريد الإلكتروني وكلمة المرور مطلوبان',
          message_en: 'Email and password are required',
          code: 'MISSING_CREDENTIALS',
        },
        { status: 400 }
      );
    }

    // Authenticate user against DB
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'بيانات الدخول غير صحيحة',
          message_en: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(user.id);

    // Build response with Set-Cookie
    const response = NextResponse.json(
      {
        success: true,
        dignity_preserved: true,
        data: {
          user: formatUserResponse(user),
          token,
        },
      },
      { status: 200 }
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
    console.error('Login error:', error);
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