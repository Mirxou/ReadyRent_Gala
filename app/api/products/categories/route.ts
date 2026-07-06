import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Product Categories API — List all categories with product count
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { productCount: 'desc' },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: categories.map((cat) => ({
        id: cat.id,
        name_ar: cat.nameAr,
        name_en: cat.nameEn ?? null,
        slug: cat.slug,
        icon: cat.icon ?? null,
        product_count: cat.productCount,
      })),
    });
  } catch (error) {
    console.error('[Categories API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب التصنيفات',
        message_en: 'An error occurred while fetching categories',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}