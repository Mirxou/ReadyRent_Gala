import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkContactRateLimit, getClientIp, readValidatedBody } from '@/lib/rate-limiter';

// ═══════════════════════════════════════════════════════════════
// POST /api/contact — Submit a contact message (no auth required)
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    // ── Rate limiting ──
    const clientIp = getClientIp(request);
    const rateCheck = checkContactRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'محاولات كثيرة. حاول بعد قليل.', message_en: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // Body size limit (10KB max for contact form)
    const bodyResult = await readValidatedBody(request, 10_000);
    if ('error' in bodyResult) {
      return NextResponse.json(bodyResult, { status: bodyResult.status });
    }
    const body = JSON.parse(bodyResult.text);
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'يرجى ملء جميع الحقول المطلوبة',
          message_en: 'Please fill in all required fields',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Try to store as a notification for the first admin user
    // If no admin exists, still return success (graceful degradation)
    try {
      const adminUser = await db.user.findFirst({
        where: { role: 'admin' },
        select: { id: true },
      });

      if (adminUser) {
        await db.notification.create({
          data: {
            userId: adminUser.id,
            type: 'contact',
            title: subject || `رسالة تواصل من ${name}`,
            message: `الاسم: ${name}\nالبريد: ${email}\n${subject ? `الموضوع: ${subject}\n` : ''}\nالرسالة: ${message}`,
          },
        });
      }
    } catch {
      // Notification creation is best-effort; don't block the response
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        message: 'تم إرسال رسالتك بنجاح',
      },
    });
  } catch (error) {
    logger.error('Contact API', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء إرسال رسالتك',
        message_en: 'An error occurred while sending your message',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}