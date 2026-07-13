import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password — Request a password reset
// No auth required. Always returns success to prevent email enumeration.
// In production, an email service would send the reset link.
// ═══════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      select: { id: true, isActive: true },
    });

    // Generate a token and store it in ActivityLog with action "reset_token"
    // This approach is simple for dev; in production use a proper token store or email service
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

      // In production, send email with reset link here:
      // await sendResetEmail(email, token);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      message: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين',
    });
  } catch (error) {
    console.error('[Forgot Password API] Error:', error);

    // Still return generic success to prevent info leakage
    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      message: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين',
    });
  }
}