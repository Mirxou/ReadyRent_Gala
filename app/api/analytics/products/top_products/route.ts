import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Top Products — By bookings, revenue, or rating
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'revenue';

    // Fetch all products with their booking aggregates
    const products = await db.product.findMany({
      include: {
        bookings: {
          select: { totalPrice: true },
          where: { status: 'completed' },
        },
        _count: {
          select: { bookings: { where: { status: 'completed' } } },
        },
      },
    });

    // Enrich and sort
    const enriched = products.map((p) => ({
      id: p.id,
      name: p.nameAr || p.name,
      slug: p.slug,
      primary_image: p.primaryImage,
      price_per_day: p.pricePerDay,
      rating: p.rating,
      total_bookings: p._count.bookings,
      total_revenue: p.bookings.reduce((sum, b) => sum + b.totalPrice, 0),
      is_premium: p.isPremium,
      is_verified: p.isVerified,
    }));

    const sorted = enriched.sort((a, b) => {
      if (metric === 'bookings') return b.total_bookings - a.total_bookings;
      if (metric === 'rating') return b.rating - a.rating;
      return b.total_revenue - a.total_revenue; // default: revenue
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: sorted.slice(0, 10),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في جلب المنتجات الأكثر مبيعاً',
        message_en: 'Error fetching top products',
        code: 'TOP_PRODUCTS_ERROR',
      },
      { status: 500 }
    );
  }
}