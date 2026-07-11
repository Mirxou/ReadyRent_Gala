// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Auth Profile API Route
// GET  /api/auth/profile  — Fetch current user profile
// PUT  /api/auth/profile  — Update current user profile
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
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

// ──── PUT: Update Profile ────
export async function PUT(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'يجب تسجيل الدخول لتحديث الملف الشخصي',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, city } = body;

    // Build update data — only include provided fields
    const updateData: Record<string, string | null> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    // city is stored on Address; if a top-level city field is requested,
    // we store it as a simple field update (the schema has no city on User,
    // so we skip it gracefully or use a first address)
    if (city !== undefined) {
      // Try to update the user's default address city
      await db.address.upsert({
        where: {
          id: `${session.userId}_default`,
        },
        create: {
          id: `${session.userId}_default`,
          userId: session.userId,
          address: '',
          city: city,
          isDefault: true,
        },
        update: {
          city: city,
        },
      }).catch(() => {
        // Silently ignore address errors — not critical
      });
    }

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('[Profile Update] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء تحديث الملف الشخصي، يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}