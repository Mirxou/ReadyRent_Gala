import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getSessionFromRequest } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Subscription Plans API — Returns { plans, active_plan, history }
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // Fetch all active plans (public)
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    const plansData = plans.map((p) => ({
      id: p.id,
      plan_id: p.planId,
      name_ar: p.nameAr,
      name_en: p.nameEn,
      price: p.price,
      bookings_limit: p.bookingsLimit,
      features: JSON.parse(p.features || '[]'),
    }));

    // Try to get session for personalized data (optional — plans are always returned)
    let activePlan = null;
    let history: Array<Record<string, unknown>> = [];

    try {
      const session = await getSessionFromRequest(request);
      if (session) {
        // Get active subscription
        const activeSub = await db.userSubscription.findFirst({
          where: { userId: session.userId, status: 'active' },
          orderBy: { createdAt: 'desc' },
          include: { plan: { select: { planId: true, nameAr: true, price: true, bookingsLimit: true, features: true } } },
        });

        if (activeSub && activeSub.plan) {
          // Count bookings in the current subscription period
          const bookingsUsed = await db.booking.count({
            where: {
              userId: session.userId,
              createdAt: { gte: activeSub.startDate },
            },
          });

          activePlan = {
            id: activeSub.plan.planId,
            plan_id: activeSub.plan.planId,
            name: activeSub.plan.nameAr || activeSub.plan.planId,
            price: activeSub.plan.price,
            bookings_limit: activeSub.plan.bookingsLimit,
            end_date: activeSub.endDate?.toISOString() || null,
            bookings_used: bookingsUsed,
            features: JSON.parse(activeSub.plan.features || '[]'),
          };
        }

        // Get subscription history
        const subs = await db.userSubscription.findMany({
          where: { userId: session.userId },
          orderBy: { createdAt: 'desc' },
          include: { plan: { select: { nameAr: true } } },
        });

        history = subs.map((sub) => ({
          id: sub.id,
          date: sub.createdAt.toISOString(),
          plan: sub.plan?.nameAr || sub.planId,
          amount: sub.amount,
          status: sub.status === 'active' ? 'نشط' as const
            : sub.status === 'cancelled' ? 'ملغي' as const
            : 'مدفوع' as const,
        }));
      }
    } catch {
      // Auth not available — return public plans only
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        plans: plansData,
        active_plan: activePlan,
        history,
      },
    });
  } catch (error) {
    logger.error('Subscriptions API', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب خطط الاشتراك',
        message_en: 'An error occurred while fetching subscription plans',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
