// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Auth Profile API Route
// GET /api/auth/profile/
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, formatUserResponse } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    // Get session from cookie or Authorization header
    const session = getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لم يتم العثور على جلسة صالحة',
          message_en: 'No valid session found',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // Fetch user from DB
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'المستخدم غير موجود أو غير مفعل',
          message_en: 'User not found or inactive',
          code: 'USER_NOT_FOUND',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        dignity_preserved: true,
        data: formatUserResponse(user),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile error:', error);
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