// ═══════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password — Request a password reset
// P2-32 fix: token is now stored as bcrypt hash (was plain text → DB read = use any token)
// P2-33 fix: per-email rate limit added (was IP-only → attacker with many IPs could spam)
// No auth required. Always returns success to prevent email enumeration.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { passwordResetEmail } from '@/lib/email-templates';
import {
  checkSmsRateLimit,
  checkForgotPasswordRateLimit,
  getClientIp,
  readValidatedBody,
} from '@/lib/rate-limiter';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  try {
    // ── Rate limiting — IP (3/hour) ──
    const clientIp = getClientIp(request);
    const ipRate = checkSmsRateLimit(clientIp);
    if (!ipRate.allowed) {
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

    const normalizedEmail = email.trim().toLowerCase();

    // ── P2-33 fix: per-email rate limit (3/hour) ──
    // Runs BEFORE we even hit the DB so an attacker spamming random emails
    // doesn't generate DB load. Note: this is an early reject; if the email
    // doesn't exist we still return success (anti-enumeration) but the limiter
    // counts the request so an attacker can't probe infinitely.
    const emailRate = checkForgotPasswordRateLimit(normalizedEmail);
    if (!emailRate.allowed) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'محاولات كثيرة على هذا البريد. حاول بعد ساعة.', message_en: 'Too many requests for this email. Try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isActive: true, firstName: true, username: true, email: true },
    });

    // Generate a token, store it (hashed), and send reset email
    if (user && user.isActive) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

      // ── P2-32 fix: hash the token with bcrypt before storing ──
      // Was: `action: 'reset_token:<rawToken>:<expiresAtISO>'`
      // Anyone with DB read access (backup, dev laptop) could use any active
      // token to reset any user's password. Now we store only the hash.
      // The expiry is encoded as a number to avoid the split(':') bug in
      // reset-password where ISO timestamps contain colons.
      const tokenHash = await bcrypt.hash(rawToken, 10);
      await db.activityLog.create({
        data: {
          userId: user.id,
          // Format: reset_token:<bcryptHash>:<expiresAtMs>
          action: `reset_token:${tokenHash}:${expiresAt}`,
          target: 'password_reset',
        },
      });

      // Send password reset email (fire-and-forget, but logged on failure)
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/reset-password?token=${rawToken}`;
      const displayName = user.firstName || user.username || user.email;
      sendEmail({
        to: user.email,
        subject: 'إعادة تعيين كلمة المرور — STANDARD.Rent 🔐',
        html: passwordResetEmail(displayName, resetLink),
      }).catch((e: unknown) => {
        // P2 fix: was `/* already logged inside sendEmail */` — but the catch
        // swallowed errors silently. Now we log them so we can monitor email
        // delivery failures.
        logger.error('Forgot Password', 'Failed to send reset email', { userId: user.id, error: e });
      });
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
