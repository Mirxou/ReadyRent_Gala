// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Auth Register API Route
// POST /api/auth/register/
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession, formatUserResponse } from '@/lib/auth-server';

const SEVEN_DAYS = 7 * 24 * 60 * 60;

const VALID_ROLES = ['customer', 'vendor'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username, first_name, last_name, phone, role } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'البريد الإلكتروني وكلمة المرور مطلوبان',
          message_en: 'Email and password are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'صيغة البريد الإلكتروني غير صحيحة',
          message_en: 'Invalid email format',
          code: 'INVALID_EMAIL',
        },
        { status: 400 }
      );
    }

    // Validate password strength (min 6 chars)
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
          message_en: 'Password must be at least 6 characters',
          code: 'WEAK_PASSWORD',
        },
        { status: 400 }
      );
    }

    // Validate role if provided
    const userRole = role && VALID_ROLES.includes(role) ? role : 'customer';

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
        role: userRole,
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
    console.error('Registration error:', error);
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