// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Auth Logout API Route
// POST /api/auth/logout/
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { getSessionFromRequest, destroySession } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    // Get session and destroy it
    const session = getSessionFromRequest(request);
    if (session) {
      destroySession(session.token);
    }

    // Build response that clears the cookie
    const response = NextResponse.json(
      {
        success: true,
        dignity_preserved: true,
        data: { message: 'logged_out' },
      },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.set('session_token', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
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