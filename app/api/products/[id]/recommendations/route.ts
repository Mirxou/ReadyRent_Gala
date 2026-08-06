import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════
// Product Recommendations API
// Returns category-based recommendations for a given product
// ═══════════════════════════════════════════════════════════════════

function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

interface ProductWithRelations {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string | null;
  pricePerDay: number;
  images: string;
  primaryImage: string | null;
  isAvailable: boolean;
  rating: number;
  trustScore: number;
  isPremium: boolean;
  isVerified: boolean;
  depositAmount: number;
  sizeOptions: string;
  colorOptions: string;
  locationName: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; nameAr: string; nameEn: string | null; slug: string; icon: string | null } | null;
  vendor: { id: string; name: string; nameAr: string; avatar: string | null; rating: number; trustScore: number; isVerified: boolean } | null;
}

function formatProduct(product: ProductWithRelations) {
  const images = safeJsonParse<{ id?: string; image?: string; url?: string; is_main?: boolean; is_primary?: boolean }[]>(product.images, []);
  const primaryImage = product.primaryImage || images?.[0]?.image || images?.[0]?.url || null;

  return {
    id: product.id,
    name: product.name,
    name_ar: product.nameAr,
    slug: product.slug,
    description: product.description ?? null,
    price_per_day: product.pricePerDay,
    primary_image: primaryImage,
    images: images,
    is_available: product.isAvailable,
    rating: product.rating,
    trust_score: product.trustScore,
    is_premium: product.isPremium,
    is_verified: product.isVerified,
    deposit_amount: product.depositAmount,
    size_options: safeJsonParse(product.sizeOptions, []),
    color_options: safeJsonParse(product.colorOptions, []),
    location_name: product.locationName ?? null,
    category: product.category
      ? {
          id: product.category.id,
          name_ar: product.category.nameAr,
          name_en: product.category.nameEn ?? null,
          slug: product.category.slug,
          icon: product.category.icon ?? null,
        }
      : null,
    vendor: product.vendor
      ? {
          id: product.vendor.id,
          name: product.vendor.name,
          name_ar: product.vendor.nameAr,
          avatar: product.vendor.avatar ?? null,
          rating: product.vendor.rating,
          trust_score: product.vendor.trustScore,
          is_verified: product.vendor.isVerified,
        }
      : null,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch current product
    const product = await db.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'المنتج غير موجود' },
        { status: 404 }
      );
    }

    // 2. Get candidate products from same category (exclude current)
    let candidates = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isAvailable: true,
      },
      take: 10,
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true, slug: true, icon: true } },
        vendor: { select: { id: true, name: true, nameAr: true, avatar: true, rating: true, trustScore: true, isVerified: true } },
      },
    });

    // Fallback: if no same-category products, get any available products
    if (candidates.length === 0) {
      candidates = await db.product.findMany({
        where: {
          id: { not: product.id },
          isAvailable: true,
        },
        take: 4,
        include: {
          category: { select: { id: true, nameAr: true, nameEn: true, slug: true, icon: true } },
          vendor: { select: { id: true, name: true, nameAr: true, avatar: true, rating: true, trustScore: true, isVerified: true } },
        },
      });

      // Still no products at all — return empty
      if (candidates.length === 0) {
        return NextResponse.json({ success: true, dignity_preserved: true, data: [] });
      }
    }

    // 3. Return top 4 category-based recommendations
    const recommendations = candidates.slice(0, 4).map(formatProduct);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: recommendations,
    });
  } catch (error) {
    logger.error('Recommendations API', 'Error', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب التوصيات' },
      { status: 500 }
    );
  }
}
