import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Service Categories API — Public listing of LocalGuideCategory
// Falls back to hardcoded categories if DB is empty
// ═══════════════════════════════════════════════════════════════════

const HARDCODED_CATEGORIES = [
  { slug: 'weddings', name_ar: 'أماكن أعراس', icon: 'PartyPopper' },
  { slug: 'photography', name_ar: 'مصورين', icon: 'Camera' },
  { slug: 'makeup', name_ar: 'مكياج', icon: 'Palette' },
  { slug: 'dj', name_ar: 'دج', icon: 'Music' },
  { slug: 'flowers', name_ar: 'زهور', icon: 'Flower2' },
  { slug: 'parties', name_ar: 'تنسيق حفلات', icon: 'Sparkles' },
];

export async function GET() {
  try {
    // Try to fetch from DB first
    const categories = await db.localGuideCategory.findMany({
      orderBy: { serviceCount: 'desc' },
    });

    // If DB has categories, return them; otherwise fall back to hardcoded
    const data =
      categories.length > 0
        ? categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            name_ar: c.nameAr,
            name_en: c.nameEn,
            icon: c.icon,
            service_count: c.serviceCount,
          }))
        : HARDCODED_CATEGORIES;

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch (error) {
    console.error('[Service Categories API] Error:', error);
    // Even on error, return hardcoded categories so the page works
    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: HARDCODED_CATEGORIES,
    });
  }
}