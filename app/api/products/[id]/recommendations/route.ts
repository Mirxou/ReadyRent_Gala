import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// ═══════════════════════════════════════════════════════════════════
// AI Product Recommendations API
// Uses z-ai-web-dev-sdk LLM to pick the 4 best recommendations
// Falls back to category-based if LLM fails or times out (5s)
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
        return NextResponse.json({ success: true, recommendations: [] });
      }

      // Not enough candidates to warrant AI — return directly
      return NextResponse.json({
        success: true,
        recommendations: candidates.slice(0, 4).map(formatProduct),
      });
    }

    // 3. Try AI-powered recommendation with 5s timeout
    let recommendedIds: string[] = [];

    try {
      const zai = await ZAI.create();

      const candidatesList = candidates
        .map((c) => `- ${c.nameAr} (فئة: ${c.category?.nameAr || 'غير محدد'}, سعر: ${c.pricePerDay} دج/يوم, معرف: ${c.id}, تقييم: ${c.rating})`)
        .join('\n');

      const prompt = `أنت مستشار أزياء في منصة STANDARD.Rent للكراء الفاخر في الجزائر.
المنتج الحالي: ${product.nameAr} (${product.category?.nameAr || 'غير محدد'})
المرشحون:
${candidatesList}

اختر أفضل 4 منتجات مكملة أو مشابهة لهذا المنتج. ضع في اعتبارك التنوع في الأسعار والأنماط.
أجب فقط بقائمة معرفات المنتجات مفصولة بفواصل، بدون أي نص آخر.`;

      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: 'أنت مساعد ذكي يختار المنتجات المناسبة. أجب بقائمة معرفات فقط.',
            },
            { role: 'user', content: prompt },
          ],
          thinking: { type: 'disabled' },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM timeout')), 5000)
        ),
      ]);

      const responseText = completion.choices?.[0]?.message?.content || '';
      // Match CUID-like IDs (at least 20 chars alphanumeric)
      const idMatches = responseText.match(/[a-z0-9]{20,}/g);
      if (idMatches && idMatches.length > 0) {
        recommendedIds = idMatches.slice(0, 4);
      }
    } catch (llmError) {
      // LLM failed — fall back to category-based recommendations
      console.warn('[Recommendations API] LLM failed, using fallback:', llmError);
    }

    // 4. Build final recommendations list
    let recommendations: ReturnType<typeof formatProduct>[] = [];

    if (recommendedIds.length > 0) {
      // Get full product data for AI-recommended IDs
      const aiRecommended = await db.product.findMany({
        where: { id: { in: recommendedIds } },
        include: {
          category: { select: { id: true, nameAr: true, nameEn: true, slug: true, icon: true } },
          vendor: { select: { id: true, name: true, nameAr: true, avatar: true, rating: true, trustScore: true, isVerified: true } },
        },
      });

      // Preserve AI ordering
      const idOrderMap = new Map(recommendedIds.map((id, i) => [id, i]));
      recommendations = aiRecommended
        .sort((a, b) => (idOrderMap.get(a.id) ?? 99) - (idOrderMap.get(b.id) ?? 99))
        .map(formatProduct);

      // Fill remaining slots with top candidates from same category
      if (recommendations.length < 4) {
        const remaining = candidates
          .filter((c) => !recommendations.find((r) => r.id === c.id))
          .slice(0, 4 - recommendations.length)
          .map(formatProduct);
        recommendations.push(...remaining);
      }
    } else {
      // Pure fallback: top candidates from same category
      recommendations = candidates.slice(0, 4).map(formatProduct);
    }

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('[Recommendations API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب التوصيات' },
      { status: 500 }
    );
  }
}