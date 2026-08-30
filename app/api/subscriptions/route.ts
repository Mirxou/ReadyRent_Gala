import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════
// Subscription Plans API — Full database integration
// Returns { active_plan, plans, history }
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    // ── Fetch all active plans (public, no auth needed) ──
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

    // ── Authenticated data: active plan + history ──
    let active_plan: Record<string, unknown> | null = null;
    let history: Record<string, unknown>[] = [];

    if (session) {
      // Fetch user's active subscription
      const activeSub = await db.userSubscription.findFirst({
        where: {
          userId: session.userId,
          status: 'active',
        },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      if (activeSub) {
        // Count bookings made during subscription period
        const bookingsUsed = await db.booking.count({
          where: {
            userId: session.userId,
            createdAt: { gte: activeSub.startDate },
          },
        });

        active_plan = {
          id: activeSub.plan.id,
          plan_id: activeSub.plan.planId,
          name_ar: activeSub.plan.nameAr,
          name_en: activeSub.plan.nameEn || null,
          price: activeSub.plan.price,
          end_date: activeSub.endDate?.toISOString() || null,
          bookings_used: bookingsUsed,
          bookings_limit: activeSub.plan.bookingsLimit,
        };
      }

      // Fetch subscription history (last 20)
      const subscriptions = await db.userSubscription.findMany({
        where: { userId: session.userId },
        include: { plan: { select: { nameAr: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      history = subscriptions.map((s) => ({
        id: s.id,
        date: s.createdAt.toISOString(),
        plan: s.plan.nameAr,
        amount: s.amount,
        status: s.status === 'active' ? 'نشط' : s.status === 'cancelled' ? 'ملغي' : 'مدفوع',
      }));
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        active_plan: active_plan,
        plans: plansData,
        history,
      },
    });
  } catch (error) {
    logger.error('Subscriptions API', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب بيانات الاشتراكات',
        message_en: 'An error occurred while fetching subscription data',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
