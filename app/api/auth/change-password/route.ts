// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Change Password API Route
// POST /api/auth/change-password — Change current user's password
// P0-7 fix: this route was missing entirely. The settings page was POSTing
// to it and silently failing with a 501 catch-all response.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSessionFromRequest,
  authRequiredResponse,
  verifyPassword,
  hashPassword,
} from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { checkWalletRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  new_password: z
    .string()
    .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    // P2 fix: enforce light complexity — at least one letter and one digit
    .refine(pw => /[a-zA-Z]/.test(pw) && /\d/.test(pw), 'كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // ── Rate limiting: 5 password changes per minute ──
    const rateCheck = checkWalletRateLimit(session.userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Too many attempts, please wait.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: firstError?.message || 'بيانات غير صالحة', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { current_password, new_password } = parsed.data;

    // ── Fetch user with current hash ──
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'المستخدم غير موجود', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // ── Verify current password ──
    const isValid = await verifyPassword(current_password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'كلمة المرور الحالية غير صحيحة', code: 'WRONG_PASSWORD' },
        { status: 401 }
      );
    }

    // ── Reject same-password reuse ──
    if (current_password === new_password) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'كلمة المرور الجديدة لا يمكن أن تكون مطابقة للقديمة', code: 'SAME_PASSWORD' },
        { status: 400 }
      );
    }

    // ── Hash + update ──
    const newHash = await hashPassword(new_password);
    await db.user.update({
      where: { id: session.userId },
      data: { passwordHash: newHash },
    });

    logger.info('Auth/ChangePassword', 'Password changed successfully', { userId: session.userId });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      message_ar: 'تم تغيير كلمة المرور بنجاح',
      message_en: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Auth/ChangePassword', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'حدث خطأ أثناء تغيير كلمة المرور', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
