import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Services API — Public browsing of LocalGuideService
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const where: Record<string, unknown> = {};

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { descriptionAr: { contains: search } },
        { descriptionEn: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const services = await db.localGuideService.findMany({
      where,
      include: { category: true },
      take: limit,
      orderBy: { featured: 'desc' },
    });

    const data = services.map((s) => ({
      id: s.id,
      name: s.name,
      name_ar: s.nameAr,
      description_ar: s.descriptionAr,
      description_en: s.descriptionEn,
      category_ar: s.category.nameAr,
      category_slug: s.category.slug,
      city: s.city,
      location: s.city,
      rating: s.rating,
      review_count: s.reviewCount,
      price_range: s.priceRange,
      image: s.imageUrl,
      image_url: s.imageUrl,
      phone: s.phone,
      whatsapp: s.whatsapp,
      is_verified: s.isVerified,
      featured: s.featured,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch (error) {
    console.error('[Services API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب قائمة الخدمات',
        message_en: 'An error occurred while fetching services',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}