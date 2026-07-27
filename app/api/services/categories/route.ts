import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Service Categories API - Public listing from DB only

export async function GET() {
  try {
    const categories = await db.localGuideCategory.findMany({
      orderBy: { serviceCount: 'desc' },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name_ar: c.nameAr,
        name_en: c.nameEn,
        icon: c.icon,
        service_count: c.serviceCount,
      })),
    });
  } catch (error) {
    console.error('[Service Categories API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'خطأ في جلب الفئات', message_en: 'Error fetching categories' },
      { status: 500 }
    );
  }
}
