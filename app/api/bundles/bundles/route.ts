import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════
// Bundles API — Full database integration
// P1 fix: was `take: limit` with `limit = undefined` when no query param,
// which made Prisma return ALL bundles. Now uses default 20 + max 50 + skip.
// ═══════════════════════════════════════════════════════════════════

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // P1 fix: parse + sanitize pagination params (was undefined → ALL rows)
    let page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { descriptionAr: { contains: search } },
      ];
    }

    const [bundles, total] = await Promise.all([
      db.bundle.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  pricePerDay: true,
                  primaryImage: true,
                  slug: true,
                  isAvailable: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
      db.bundle.count({ where }),
    ]);

    const data = bundles.map((b) => ({
      id: b.id,
      name: b.name,
      name_ar: b.nameAr,
      description_ar: b.descriptionAr,
      discount_percentage: b.discountPercentage,
      total_price: b.totalPrice,
      image: b.image,
      includes: JSON.parse(b.includes || '[]'),
      valid_days: b.validDays,
      items: b.items.map((item) => ({
        id: item.id,
        order: item.order,
        product: {
          id: item.product.id,
          name: item.product.name,
          name_ar: item.product.nameAr,
          price_per_day: item.product.pricePerDay,
          primary_image: item.product.primaryImage,
          slug: item.product.slug,
          is_available: item.product.isAvailable,
        },
      })),
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Bundles API', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب قائمة الباقات',
        message_en: 'An error occurred while fetching bundles',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}