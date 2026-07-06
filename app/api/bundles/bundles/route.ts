import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Bundles API — Full database integration
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { descriptionAr: { contains: search } },
      ];
    }

    const bundles = await db.bundle.findMany({
      where,
      take: limit,
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
    });

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
    });
  } catch (error) {
    console.error('[Bundles API] Error:', error);
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