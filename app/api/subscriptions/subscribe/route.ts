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

    // Check user has enough wallet balance
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { walletBalance: true },
    });

    if (!user || user.walletBalance < plan.price) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رصيد المحفظة غير كافي للاشتراك في هذه الخطة',
          message_en: 'Insufficient wallet balance to subscribe to this plan',
          code: 'INSUFFICIENT_BALANCE',
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

    // Deduct price from wallet and create subscription in a transaction
    await db.$transaction([
      // Deduct from wallet
      db.user.update({
        where: { id: session.userId },
        data: { walletBalance: { decrement: plan.price } },
      }),
      // Create subscription
      db.userSubscription.create({
        data: {
          userId: session.userId,
          planId,
          amount: plan.price,
          status: 'active',
          startDate: now,
          endDate,
        },
      }),
      // Create transaction record
      db.transaction.create({
        data: {
          userId: session.userId,
          type: 'EXPENDITURE',
          amount: plan.price,
          note: `اشتراك في خطة ${plan.nameAr || plan.nameEn || planId}`,
        },
      }),
    ]);

    // Create notification
    await db.notification.create({
      data: {
        userId: session.userId,
        type: 'system',
        title: 'تم الاشتراك بنجاح',
        message: `تم الاشتراك في خطة "${plan.nameAr || plan.nameEn || planId}" بنجاح. اشتراكك صالح لمدة 30 يوماً.`,
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