import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/subscriptions/cancel — Cancel an active subscription
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

    // Find active subscription for this user + plan
    const subscription = await db.userSubscription.findFirst({
      where: {
        userId: session.userId,
        planId,
        status: 'active',
      },
    });

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لا يوجد اشتراك نشط لهذه الخطة',
          message_en: 'No active subscription found for this plan',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Mark as cancelled
    const updated = await db.userSubscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled' },
    });

    // Create notification for the user
    await db.notification.create({
      data: {
        userId: session.userId,
        type: 'system',
        title: 'تم إلغاء الاشتراك',
        message: `تم إلغاء اشتراكك بنجاح. يمكنك الاشتراك مجدداً في أي وقت.`,
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: updated.id,
        status: updated.status,
        message: 'تم إلغاء الاشتراك بنجاح',
      },
    });
  } catch (error) {
    console.error('[Subscription Cancel API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء إلغاء الاشتراك',
        message_en: 'An error occurred while cancelling the subscription',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}