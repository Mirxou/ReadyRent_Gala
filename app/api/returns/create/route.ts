import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { validateBody, createReturnRequestSchema } from '@/lib/validators';
import { checkCreateRateLimit, getClientIp } from '@/lib/rate-limiter';

// ═══════════════════════════════════════════════════════════════
// POST /api/returns/create — Create a return request
// SECURITY: Zod validated, rate limited, duplicate prevention
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    // ── Rate limiting ──
    const clientIp = getClientIp(request);
    const rateCheck = checkCreateRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'محاولات كثيرة. حاول بعد قليل.', message_en: 'Too many requests.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();

    // ── Zod validation ──
    const vResult = validateBody(createReturnRequestSchema, body);
    if (!vResult.success) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: vResult.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { booking_id, reason, description } = vResult.data;

    // Verify the booking belongs to the user
    const booking = await db.booking.findUnique({
      where: { id: booking_id },
      select: { userId: true, productId: true },
    });

    if (!booking || booking.userId !== session.userId) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'الحجز غير موجود', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // ── Duplicate prevention ──
    const existingReturn = await db.returnRequest.findFirst({
      where: {
        bookingId: booking_id,
        status: { in: ['pending', 'approved'] },
        userId: session.userId,
      },
    });

    if (existingReturn) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'لديك طلب إرجاع نشط بالفعل على هذا الحجز', message_en: 'You already have an active return request for this booking', code: 'DUPLICATE_RETURN' },
        { status: 409 }
      );
    }

    const returnRequest = await db.returnRequest.create({
      data: {
        userId: session.userId,
        bookingId: booking_id,
        reason,
        description: description ?? null,
        status: 'pending',
      },
    });

    // Notify vendor
    if (booking.productId) {
      const product = await db.product.findUnique({
        where: { id: booking.productId },
        select: { vendorId: true },
      });
      if (product?.vendorId) {
        await db.notification.create({
          data: {
            userId: product.vendorId,
            type: 'system',
            title: 'طلب إرجاع جديد',
            message: `تم تقديم طلب إرجاع على أحد حجوزاتك. السبب: ${reason}`,
          },
        });
      }
    }

    const data = {
      id: returnRequest.id,
      user_id: returnRequest.userId,
      booking_id: returnRequest.bookingId,
      reason: returnRequest.reason,
      description: returnRequest.description,
      status: returnRequest.status,
      created_at: returnRequest.createdAt.toISOString(),
      updated_at: returnRequest.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Returns API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
