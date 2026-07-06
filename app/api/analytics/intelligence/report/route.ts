import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Market Intelligence Report — DB aggregates
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const [
      totalProducts,
      totalVendors,
      totalUsers,
      completedBookings,
      totalRevenue,
      categoryBreakdown,
      topCities,
      avgRating,
      premiumCount,
      verifiedCount,
      bookingStatusBreakdown,
    ] = await Promise.all([
      db.product.count(),
      db.vendor.count(),
      db.user.count(),
      db.booking.count({ where: { status: 'completed' } }),
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'completed' },
      }),
      db.category.findMany({
        select: {
          id: true,
          nameAr: true,
          slug: true,
          _count: { select: { products: true } },
        },
        orderBy: { productCount: 'desc' },
        take: 10,
      }),
      db.product.groupBy({
        by: ['locationName'],
        where: { locationName: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      db.product.aggregate({ _avg: { rating: true } }),
      db.product.count({ where: { isPremium: true } }),
      db.product.count({ where: { isVerified: true } }),
      db.booking.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    // Format categories
    const categories = categoryBreakdown.map((c) => ({
      name: c.nameAr,
      slug: c.slug,
      product_count: c._count.products,
    }));

    // Format cities
    const cities = topCities
      .filter((c) => c.locationName !== null)
      .map((c) => ({
        city: c.locationName,
        product_count: c._count.id,
      }));

    // Format booking status
    const bookingStatus = bookingStatusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        overview: {
          total_products: totalProducts,
          total_vendors: totalVendors,
          total_users: totalUsers,
          total_completed_bookings: completedBookings,
          total_revenue: totalRevenue._sum.totalPrice ?? 0,
          average_rating: Math.round((avgRating._avg.rating ?? 0) * 10) / 10,
          premium_products: premiumCount,
          verified_products: verifiedCount,
        },
        categories,
        top_cities: cities,
        booking_status: bookingStatus,
        generated_at: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في جلب تقرير الذكاء السوقي',
        message_en: 'Error fetching market intelligence report',
        code: 'INTELLIGENCE_ERROR',
      },
      { status: 500 }
    );
  }
}