// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Insurance Purchase API
// POST /api/insurance/purchase
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();
    const { plan_id, booking_id } = body;

    if (!plan_id || typeof plan_id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'معرف خطة التأمين مطلوب',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    if (!booking_id || typeof booking_id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'معرف الحجز مطلوب لربط التأمين',
          message_en: 'booking_id is required to link insurance',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Find insurance plan
    const plan = await db.insurancePlan.findUnique({
      where: { id: plan_id },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'خطة التأمين غير موجودة',
          code: 'PLAN_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'خطة التأمين غير مفعلة حالياً',
          code: 'PLAN_INACTIVE',
        },
        { status: 400 }
      );
    }

    // Verify booking exists, belongs to user, and doesn't already have insurance
    const booking = await db.booking.findUnique({
      where: { id: booking_id },
      select: { id: true, userId: true, hasInsurance: true },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الحجز غير موجود',
          code: 'BOOKING_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (booking.userId !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح بإضافة تأمين لهذا الحجز',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    if (booking.hasInsurance) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'هذا الحجز مؤمن بالفعل',
          code: 'ALREADY_INSURED',
        },
        { status: 409 }
      );
    }

    const planName = plan.nameAr || plan.nameEn || 'خطة تأمين';

    // Use interactive transaction to atomically check balance, deduct, and update booking
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true, firstName: true },
      });

      if (!user || (user.walletBalance ?? 0) < plan.price) {
        return { error: 'INSUFFICIENT_BALANCE' } as const;
      }

      // Deduct from wallet
      await tx.user.update({
        where: { id: session.userId },
        data: { walletBalance: { decrement: plan.price } },
      });

      // Mark booking as insured
      await tx.booking.update({
        where: { id: booking_id },
        data: { hasInsurance: true },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: session.userId,
          type: 'EXPENDITURE',
          amount: plan.price,
          note: `شراء تأمين: ${planName} — حجز ${booking_id}`,
          hash: `tx_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      });

      // Create notification
      const userName = user.firstName || 'مستخدم';
      const notification = await tx.notification.create({
        data: {
          userId: session.userId,
          type: 'financial',
          title: 'تم شراء خطة التأمين بنجاح',
          message: `مرحباً ${userName}، تم خصم ${plan.price} د.ج من محفظتك مقابل خطة التأمين "${planName}" للحجز #${booking_id.slice(-6)}.`,
        },
      });

      return { transaction, notification } as const;
    });

    if ('error' in result) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رصيد المحفظة غير كافي لشراء خطة التأمين',
          code: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        plan_id: plan.id,
        plan_name: plan.nameAr || plan.nameEn,
        booking_id,
        amount_paid: plan.price,
        purchased_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Insurance Purchase] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء شراء خطة التأمين، يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
