import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Daily Summary — Today's snapshot
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [newBookings, newUsers, todayRevenue, activeProducts, activeBookings] = await Promise.all([
      db.booking.count({ where: { createdAt: { gte: todayStart } } }),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'completed', createdAt: { gte: todayStart } },
      }),
      db.product.count({ where: { isAvailable: true } }),
      db.booking.count({ where: { status: 'active' } }),
    ]);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        date: todayStart.toISOString().split('T')[0],
        new_bookings: newBookings,
        new_users: newUsers,
        revenue: todayRevenue._sum.totalPrice ?? 0,
        active_products: activeProducts,
        active_bookings: activeBookings,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في جلب ملخص اليوم',
        message_en: 'Error fetching daily summary',
        code: 'DAILY_SUMMARY_ERROR',
      },
      { status: 500 }
    );
  }
}