import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Vendors API — Full database integration
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { description: { contains: search } },
        { descriptionAr: { contains: search } },
      ];
    }

    if (location) {
      where.OR = [
        ...(Array.isArray(where.OR) ? where.OR : []),
        { location: { contains: location } },
        { city: { contains: location } },
      ];
    }

    const vendors = await db.vendor.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const data = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      name_ar: v.nameAr,
      description: v.description,
      description_ar: v.descriptionAr,
      location: v.location,
      city: v.city,
      rating: v.rating,
      trust_score: v.trustScore,
      products_count: v._count.products,
      total_sales: v.totalSales,
      avatar: v.avatar,
      logo: v.logo,
      is_verified: v.isVerified,
      website: v.website,
      commission_rate: v.commissionRate,
      joined_date: v.joinedDate,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch (error) {
    console.error('[Vendors API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب قائمة البائعين',
        message_en: 'An error occurred while fetching vendors',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}