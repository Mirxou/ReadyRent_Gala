import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/reset-password — Reset password using a token
// No auth required. Token was stored in ActivityLog by forgot-password.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // Validate required fields
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'جميع الحقول مطلوبة',
          message_en: 'All fields are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'كلمتا المرور غير متطابقتين',
          message_en: 'Passwords do not match',
          code: 'PASSWORD_MISMATCH',
        },
        { status: 400 }
      );
    }

    // Validate password strength
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

    // Find the token in ActivityLog
    // Format: "reset_token:<token>:<expiresAt>"
    const logs = await db.activityLog.findMany({
      where: {
        action: { startsWith: `reset_token:${token}:` },
        target: 'password_reset',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (logs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية',
          message_en: 'Invalid or expired reset token',
          code: 'INVALID_TOKEN',
        },
        { status: 400 }
      );
    }

    const log = logs[0];
    const parts = log.action.split(':');
    const expiresAt = new Date(parts[2]);

    // Check if token is expired
    if (Date.now() > expiresAt.getTime()) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رمز إعادة التعيين منتهي الصلاحية',
          message_en: 'Reset token has expired',
          code: 'TOKEN_EXPIRED',
        },
        { status: 400 }
      );
    }

    const userId = log.userId;

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password and clean up used tokens
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Delete used reset token(s) for this user
      db.activityLog.deleteMany({
        where: {
          userId,
          action: { startsWith: 'reset_token:' },
          target: 'password_reset',
        },
      }),
    ]);

    // Log the password reset action
    await db.activityLog.create({
      data: {
        userId,
        action: 'password_reset',
        target: 'auth',
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      message_ar: 'تم إعادة تعيين كلمة المرور بنجاح',
      message_en: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('[Reset Password API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء إعادة تعيين كلمة المرور',
        message_en: 'An error occurred while resetting the password',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}