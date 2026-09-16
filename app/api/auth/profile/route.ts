// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Auth Profile API Route
// GET  /api/auth/profile  — Fetch current user profile
// PUT  /api/auth/profile  — Update current user profile (incl. prefs/theme/language)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, formatUserResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    // Get session from cookie or Authorization header
    const session = await getSessionFromRequest(request);

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

    // P1 fix: include notification_preferences, theme, language in the response
    // (was missing — the settings page couldn't prefill these fields)
    let notificationPreferences: Record<string, boolean> | undefined;
    try {
      if (user.notificationPrefs) {
        notificationPreferences = JSON.parse(user.notificationPrefs) as Record<string, boolean>;
      }
    } catch {
      // Corrupt JSON in DB — fall back to undefined
    }

    const address = await db.address.findUnique({
      where: { id: `${session.userId}_default` },
      select: { city: true },
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        dignity_preserved: true,
        data: {
          ...formatUserResponse(user),
          city: address?.city ?? null,
          notification_preferences: notificationPreferences,
          theme: user.theme,
          language: user.language,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Auth/Profile', 'Profile error', error);
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
    const session = await getSessionFromRequest(request);
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
    const { firstName, lastName, phone, city, notification_preferences, theme, language } = body;

    // ── Build update data — only include provided fields ──
    const updateData: Record<string, string | null> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    // P1 fix: persist notification_preferences as JSON string
    if (notification_preferences !== undefined) {
      if (typeof notification_preferences !== 'object' || notification_preferences === null) {
        return NextResponse.json(
          { success: false, dignity_preserved: true, message_ar: 'تفضيلات الإشعارات غير صالحة', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      updateData.notificationPrefs = JSON.stringify(notification_preferences);
    }

    // P1 fix: persist theme / language
    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        return NextResponse.json(
          { success: false, dignity_preserved: true, message_ar: 'قيمة السمة غير صالحة', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      updateData.theme = theme;
    }
    if (language !== undefined) {
      if (!['ar', 'en', 'fr'].includes(language)) {
        return NextResponse.json(
          { success: false, dignity_preserved: true, message_ar: 'قيمة اللغة غير صالحة', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      updateData.language = language;
    }

    // city is stored on Address; if a top-level city field is requested,
    // we store it on the user's default address row
    if (city !== undefined) {
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
      }).catch((e: unknown) => {
        // P2 fix: log the error instead of silently swallowing it
        logger.error('Profile Update', 'Address upsert failed (non-critical)', e);
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
    logger.error('Profile Update', 'Error', error);
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
