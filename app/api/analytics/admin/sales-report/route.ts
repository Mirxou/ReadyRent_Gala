import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Sales Report — By category for the last N days
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 1), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fetch completed bookings with product+category info
    const bookings = await db.booking.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: startDate },
        productId: { not: null },
      },
      select: {
        totalPrice: true,
        product: {
          select: {
            categoryId: true,
            category: {
              select: {
                id: true,
                nameAr: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Aggregate by category
    const categoryMap = new Map<
      string,
      { category_id: string; name: string; slug: string; revenue: number; bookings_count: number }
    >();

    for (const b of bookings) {
      if (!b.product?.category) continue;

      const cat = b.product.category;
      const existing = categoryMap.get(cat.id);

      if (existing) {
        existing.revenue += b.totalPrice;
        existing.bookings_count += 1;
      } else {
        categoryMap.set(cat.id, {
          category_id: cat.id,
          name: cat.nameAr,
          slug: cat.slug,
          revenue: b.totalPrice,
          bookings_count: 1,
        });
      }
    }

    // Sort by revenue descending
    const data = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = data.reduce((sum, c) => sum + c.revenue, 0);
    const totalBookings = data.reduce((sum, c) => sum + c.bookings_count, 0);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        period_days: days,
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        total_revenue: totalRevenue,
        total_bookings: totalBookings,
        categories: data.map((c) => ({
          ...c,
          revenue_percentage: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 1000) / 10 : 0,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في جلب تقرير المبيعات',
        message_en: 'Error fetching sales report',
        code: 'SALES_REPORT_ERROR',
      },
      { status: 500 }
    );
  }
}