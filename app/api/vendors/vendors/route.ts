import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════
// Vendors API — Full database integration
// P1 fix: was `take: limit` with `limit = undefined` when no query param,
// which made Prisma return ALL vendors. Now uses default 20 + max 50 + skip.
// ═══════════════════════════════════════════════════════════════════

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';

    // P1 fix: parse + sanitize pagination params (was undefined → ALL rows)
    let page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
    const skip = (page - 1) * limit;

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

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      db.vendor.count({ where }),
    ]);

    const data = vendors.map((v) => ({
      id: v.id,
      user_id: v.userId,
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
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Vendors API', 'Error', error);
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