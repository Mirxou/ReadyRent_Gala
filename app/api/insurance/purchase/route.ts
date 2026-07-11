// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Insurance Purchase API
// POST /api/insurance/purchase
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();
    const { plan_id } = body;

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

    // Check user balance
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { walletBalance: true, firstName: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'المستخدم غير موجود',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (user.walletBalance < plan.price) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رصيد المحفظة غير كافي لشراء خطة التأمين',
          code: 'INSUFFICIENT_BALANCE',
        },
        { status: 400 }
      );
    }

    // Deduct price, create transaction and notification in a Prisma transaction
    const userName = user.firstName || 'مستخدم';
    const planName = plan.nameAr || plan.nameEn || 'خطة تأمين';

    await db.$transaction([
      // Deduct from wallet
      db.user.update({
        where: { id: session.userId },
        data: { walletBalance: { decrement: plan.price } },
      }),
      // Create transaction record
      db.transaction.create({
        data: {
          userId: session.userId,
          type: 'insurance_purchase',
          amount: plan.price,
          note: `شراء خطة التأمين: ${planName}`,
          hash: `tx_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      }),
      // Create notification
      db.notification.create({
        data: {
          userId: session.userId,
          type: 'financial',
          title: 'تم شراء خطة التأمين بنجاح',
          message: `مرحباً ${userName}، تم خصم ${plan.price} د.ج من محفظتك مقابل خطة التأمين "${planName}".`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        plan_id: plan.id,
        plan_name: plan.nameAr || plan.nameEn,
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
