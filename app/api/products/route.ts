import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════
// Products API — List with search, filters, pagination & ordering
// ═══════════════════════════════════════════════════════════════════

function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function errorResponse(
  messageAr: string,
  messageEn: string,
  code: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: messageAr,
      message_en: messageEn,
      code,
    },
    { status }
  );
}

function transformProduct(product: Record<string, unknown>) {
  return {
    id: product.id,
    name: product.name,
    name_ar: product.nameAr,
    slug: product.slug,
    description: product.description ?? null,
    price_per_day: product.pricePerDay,
    images: safeJsonParse(product.images as string, []),
    primary_image: product.primaryImage ?? null,
    category_name: (product.category as Record<string, unknown>)?.nameAr ?? null,
    location_name: product.locationName ?? null,
    is_available: product.isAvailable,
    rating: product.rating,
    is_verified: product.isVerified,
    trust_score: product.trustScore,
    is_premium: product.isPremium,
    deposit_amount: product.depositAmount,
    size_options: safeJsonParse(product.sizeOptions as string, []),
    color_options: safeJsonParse(product.colorOptions as string, []),
    created_at: (product.createdAt as Date).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const location = searchParams.get('location') || undefined;
    const availability = searchParams.get('availability');
    const ordering = searchParams.get('ordering') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) {
        (where.pricePerDay as Prisma.IntNullableFilter).gte = parseInt(minPrice, 10);
      }
      if (maxPrice) {
        (where.pricePerDay as Prisma.IntNullableFilter).lte = parseInt(maxPrice, 10);
      }
    }

    if (location) {
      where.locationName = { contains: location };
    }

    if (availability === 'available') {
      where.isAvailable = true;
    } else if (availability === 'unavailable') {
      where.isAvailable = false;
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (ordering) {
      case 'price_asc':
        orderBy = { pricePerDay: 'asc' };
        break;
      case 'price_desc':
        orderBy = { pricePerDay: 'desc' };
        break;
      case 'popularity':
        orderBy = { rating: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, nameAr: true, nameEn: true, slug: true, icon: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: products.map(transformProduct),
      meta: {
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return errorResponse(
      'حدث خطأ أثناء جلب المنتجات',
      'An error occurred while fetching products',
      'INTERNAL_ERROR',
      500
    );
  }
}