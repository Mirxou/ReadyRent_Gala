import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Revenue Data — Daily aggregation for the last N days
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 1), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fetch all completed bookings in the date range
    const bookings = await db.booking.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        totalPrice: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by date
    const revenueMap = new Map<string, { revenue: number; bookings_count: number }>();

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      revenueMap.set(key, { revenue: 0, bookings_count: 0 });
    }

    for (const b of bookings) {
      const key = b.createdAt.toISOString().split('T')[0];
      const existing = revenueMap.get(key);
      if (existing) {
        existing.revenue += b.totalPrice;
        existing.bookings_count += 1;
      }
    }

    const data = Array.from(revenueMap.entries()).map(([date, val]) => ({
      date,
      revenue: val.revenue,
      bookings_count: val.bookings_count,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في جلب بيانات الإيرادات',
        message_en: 'Error fetching revenue data',
        code: 'REVENUE_ERROR',
      },
      { status: 500 }
    );
  }
}