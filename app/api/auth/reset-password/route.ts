// ═══════════════════════════════════════════════════════════════
// POST /api/auth/reset-password — Reset password using a token
// P2-32 fix: now compares the raw token against a bcrypt hash stored in
// ActivityLog (was plain text compare via `startsWith`). The expiry is
// parsed from a numeric timestamp (was ISO string split on ':' which
// truncated at the hour).
// No auth required. Token was stored in ActivityLog by forgot-password.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { readValidatedBody, checkSmsRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  // Rate limit: 3 per hour per IP (password reset bombing prevention)
  const ip = getClientIp(request);
  const rateCheck = checkSmsRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'طلبات كثيرة جداً', message_en: 'Too many requests', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  try {
    // Body size limit (1KB is plenty for token + 2 passwords)
    const bodyResult = await readValidatedBody(request, 1024);
    if ('error' in bodyResult) {
      return NextResponse.json(bodyResult, { status: bodyResult.status });
    }
    const body = JSON.parse(bodyResult.text);
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

    // ── P2-34 fix: password complexity rules ──
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
          message_en: 'Password must be at least 8 characters',
          code: 'WEAK_PASSWORD',
        },
        { status: 400 }
      );
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل',
          message_en: 'Password must contain at least one letter and one digit',
          code: 'WEAK_PASSWORD',
        },
        { status: 400 }
      );
    }

    // ── P2-32 fix: scan all unexpired reset_token logs and bcrypt-compare ──
    // Was: `where: { action: { startsWith: 'reset_token:<rawToken>:' }}` — this
    // matched the raw token in plaintext, so anyone with DB read could use it.
    // Now we fetch all recent reset_token logs and compare hashes with bcrypt.
    // We fetch only logs created in the last hour to keep the candidate set
    // small (matches the 1-hour TTL).
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const candidates = await db.activityLog.findMany({
      where: {
        action: { startsWith: 'reset_token:' },
        target: 'password_reset',
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: 'desc' },
      // Cap at 100 to bound worst-case work — beyond this the user is doing
      // something pathological (or the table is full of stale entries).
      take: 100,
    });

    let matchedLog: { id: string; userId: string; action: string } | null = null;

    for (const log of candidates) {
      // Format stored by forgot-password: "reset_token:<bcryptHash>:<expiresAtMs>"
      // Note: bcrypt hashes contain '$' separators, not ':', so we split on the
      // first two ':' only and treat everything in between as the hash.
      const firstColon = log.action.indexOf(':');
      const secondColon = log.action.indexOf(':', firstColon + 1);
      const lastColon = log.action.lastIndexOf(':');
      if (firstColon === -1 || secondColon === -1 || lastColon === secondColon) continue;

      const storedHash = log.action.slice(firstColon + 1, lastColon);
      const expiresAtMsStr = log.action.slice(lastColon + 1);

      // Quick check: is the token still valid by expiry?
      const expiresAtMs = parseInt(expiresAtMsStr, 10);
      if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
        continue;
      }

      // Bcrypt compare — constant time
      try {
        if (await bcrypt.compare(token, storedHash)) {
          matchedLog = log;
          break;
        }
      } catch {
        // Corrupt hash — skip
        continue;
      }
    }

    if (!matchedLog) {
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

    const userId = matchedLog.userId!;

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password and clean up used tokens (atomic)
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Delete used reset token(s) for this user (single-use)
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
    logger.error('Reset Password API', 'Error', error);
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
