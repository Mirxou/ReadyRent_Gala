import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
// ═══════════════════════════════════════════════════════════════════
// Product Detail API — Get product by id or slug
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

const productIncludes = {
  category: {
    select: { id: true, nameAr: true, nameEn: true, slug: true, icon: true },
  },
  vendor: {
    select: {
      id: true,
      name: true,
      nameAr: true,
      avatar: true,
      logo: true,
      rating: true,
      trustScore: true,
      isVerified: true,
      location: true,
      city: true,
      productsCount: true,
      totalSales: true,
    },
  },
  reviews: {
    where: { status: 'approved' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let product;
    try {
      product = await db.product.findUnique({
        where: { id },
        include: productIncludes,
      });
    } catch {
      // Not a valid cuid format — fall through to slug lookup
    }

    if (!product) {
      product = await db.product.findUnique({
        where: { slug: id },
        include: productIncludes,
      });
    }

    if (!product) {
      return errorResponse(
        'المنتج غير موجود',
        'Product not found',
        'NOT_FOUND',
        404
      );
    }

    const transformedReviews = product.reviews.map((review: { id: string; userId: string; reviewerName: string; rating: number; comment: string | null; isVerified: boolean; status: string; createdAt: Date; user: { id: string; username: string | null } | null }) => ({
      id: review.id,
      user_id: review.userId,
      reviewer_name: review.reviewerName,
      rating: review.rating,
      comment: review.comment ?? null,
      is_verified: review.isVerified,
      status: review.status,
      created_at: review.createdAt.toISOString(),
      user: review.user
        ? { id: review.user.id, username: review.user.username }
        : null,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: product.id,
        name: product.name,
        name_ar: product.nameAr,
        slug: product.slug,
        description: product.description ?? null,
        price_per_day: product.pricePerDay,
        listing_type: product.listingType,
        images: safeJsonParse(product.images, []),
        primary_image: product.primaryImage ?? null,
        category: product.category
          ? {
              id: product.category.id,
              name_ar: product.category.nameAr,
              name_en: product.category.nameEn ?? null,
              slug: product.category.slug,
              icon: product.category.icon ?? null,
            }
          : null,
        vendor: product.vendor ?? null,
        location_name: product.locationName ?? null,
        is_available: product.isAvailable,
        rating: product.rating,
        is_verified: product.isVerified,
        trust_score: product.trustScore,
        is_premium: product.isPremium,
        deposit_amount: product.depositAmount,
        size_options: safeJsonParse(product.sizeOptions, []),
        color_options: safeJsonParse(product.colorOptions, []),
        reviews: transformedReviews,
        created_at: product.createdAt.toISOString(),
        updated_at: product.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Product Detail API] Error:', error);
    return errorResponse(
      'حدث خطأ أثناء جلب تفاصيل المنتج',
      'An error occurred while fetching product details',
      'INTERNAL_ERROR',
      500
    );
  }
}