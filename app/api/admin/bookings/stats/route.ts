import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/bookings/stats — Booking statistics (admin/staff)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const [total, statusCounts, totalRevenue, pendingRevenue, activeRevenue, thisMonthCount, lastMonthCount] = await Promise.all([
      db.booking.count(),
      db.booking.groupBy({ by: ['status'], _count: { id: true } }),
      db.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'completed' } }),
      db.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'pending' } }),
      db.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'active' } }),
      // This month
      db.booking.count({
        where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
      // Last month
      db.booking.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of statusCounts) {
      statusMap[s.status] = s._count.id;
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        total_bookings: total,
        by_status: statusMap,
        completed_revenue: totalRevenue._sum.totalPrice ?? 0,
        pending_revenue: pendingRevenue._sum.totalPrice ?? 0,
        active_revenue: activeRevenue._sum.totalPrice ?? 0,
        this_month_bookings: thisMonthCount,
        last_month_bookings: lastMonthCount,
        growth_percent: lastMonthCount > 0 ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('[Admin Booking Stats API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error fetching booking stats', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}