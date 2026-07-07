import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Subscription Plans API — Full database integration
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    const data = plans.map((p) => ({
      id: p.id,
      plan_id: p.planId,
      name_ar: p.nameAr,
      name_en: p.nameEn,
      price: p.price,
      bookings_limit: p.bookingsLimit,
      features: JSON.parse(p.features || '[]'),
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch (error) {
    console.error('[Subscriptions API] Error:', error);
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