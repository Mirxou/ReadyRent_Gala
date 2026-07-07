import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Admin Dashboard Stats — Aggregated counts from DB
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const [totalUsers, totalProducts, totalBookings, completedRevenue, statusCounts, activeProducts] =
      await Promise.all([
        db.user.count(),
        db.product.count(),
        db.booking.count(),
        db.booking.aggregate({
          _sum: { totalPrice: true },
          where: { status: 'completed' },
        }),
        db.booking.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        db.product.count({ where: { isAvailable: true } }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const s of statusCounts) {
      statusMap[s.status] = s._count.id;
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        total_users: totalUsers,
        total_products: totalProducts,
        total_bookings: totalBookings,
        total_revenue: completedRevenue._sum.totalPrice ?? 0,
        active_bookings: statusMap['active'] ?? 0,
        pending_bookings: statusMap['pending'] ?? 0,
        completed_bookings: statusMap['completed'] ?? 0,
        active_products: activeProducts,
      },
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في جلب إحصائيات لوحة التحكم',
        message_en: 'Error fetching dashboard stats',
        code: 'DASHBOARD_ERROR',
      },
      { status: 500 }
    );
  }
}