import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { passwordResetEmail } from '@/lib/email-templates';
import { checkSmsRateLimit, getClientIp, readValidatedBody } from '@/lib/rate-limiter';

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password — Request a password reset
// No auth required. Always returns success to prevent email enumeration.
// In production, an email service would send the reset link.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    // ── Rate limiting (same as SMS — email bombing prevention) ──
    const clientIp = getClientIp(request);
    const rateCheck = checkSmsRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'محاولات كثيرة. حاول بعد قليل.', message_en: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const bodyResult = await readValidatedBody(request, 1024);
    if ('error' in bodyResult) {
      return NextResponse.json(bodyResult, { status: bodyResult.status });
    }
    const body = JSON.parse(bodyResult.text);
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'البريد الإلكتروني مطلوب',
          message_en: 'Email is required',
          code: 'MISSING_EMAIL',
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, isActive: true, firstName: true, username: true, email: true },
    });

    // Generate a token, store it, and send reset email
    if (user && user.isActive) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.activityLog.create({
        data: {
          userId: user.id,
          action: `reset_token:${token}:${expiresAt.toISOString()}`,
          target: 'password_reset',
        },
      });

      // Send password reset email (fire-and-forget)
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/reset-password?token=${token}`;
      const displayName = user.firstName || user.username || user.email;
      sendEmail({
        to: user.email,
        subject: 'إعادة تعيين كلمة المرور — STANDARD.Rent 🔐',
        html: passwordResetEmail(displayName, resetLink),
      }).catch(() => {/* already logged inside sendEmail */});
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: null,
      message_ar: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين',
      message_en: 'If the email is registered, a reset link will be sent',
    });
  } catch (error) {
    logger.error('Forgot Password API', 'Error', error);

    // Still return generic success to prevent info leakage
    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: null,
      message_ar: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين',
      message_en: 'If the email is registered, a reset link will be sent',
    });
  }
}