import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/subscriptions/subscribe — Subscribe to a plan
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'يرجى تحديد خطة الاشتراك',
          message_en: 'Please specify a subscription plan',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Get the plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'خطة الاشتراك غير موجودة',
          message_en: 'Subscription plan not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'هذه الخطة غير متاحة حالياً',
          message_en: 'This plan is currently unavailable',
          code: 'PLAN_INACTIVE',
        },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription for this plan
    const existingSub = await db.userSubscription.findFirst({
      where: {
        userId: session.userId,
        planId,
        status: 'active',
      },
    });

    if (existingSub) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لديك اشتراك نشط بالفعل في هذه الخطة',
          message_en: 'You already have an active subscription to this plan',
          code: 'ALREADY_SUBSCRIBED',
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
    const planName = plan.nameAr || plan.nameEn || planId;

    // Use interactive transaction to atomically check balance, deduct, and create subscription
    const result = await db.$transaction(async (tx) => {
      // Check balance inside transaction
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true },
      });

      if (!user || (user.walletBalance ?? 0) < plan.price) {
        return { error: 'INSUFFICIENT_BALANCE' } as const;
      }

      // Deduct from wallet
      await tx.user.update({
        where: { id: session.userId },
        data: { walletBalance: { decrement: plan.price } },
      });

      // Create subscription
      const subscription = await tx.userSubscription.create({
        data: {
          userId: session.userId,
          planId,
          amount: plan.price,
          status: 'active',
          startDate: now,
          endDate,
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: session.userId,
          type: 'EXPENDITURE',
          amount: plan.price,
          note: `اشتراك في خطة ${planName}`,
        },
      });

      return { subscription, transaction } as const;
    });

    if ('error' in result) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رصيد المحفظة غير كافي للاشتراك في هذه الخطة',
          message_en: 'Insufficient wallet balance to subscribe to this plan',
          code: result.error,
        },
        { status: 400 }
      );
    }

    // Create notification (outside transaction — non-critical)
    await db.notification.create({
      data: {
        userId: session.userId,
        type: 'system',
        title: 'تم الاشتراك بنجاح',
        message: `تم الاشتراك في خطة "${planName}" بنجاح. اشتراكك صالح لمدة 30 يوماً.`,
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        message: 'تم الاشتراك في الخطة بنجاح',
        plan_id: planId,
        amount: plan.price,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Subscription Subscribe API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء الاشتراك في الخطة',
        message_en: 'An error occurred while subscribing to the plan',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}