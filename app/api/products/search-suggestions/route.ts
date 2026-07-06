import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Search Suggestions API — Quick product name suggestions
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();

    if (!q || q.length < 1) {
      return NextResponse.json({
        success: true,
        dignity_preserved: true,
        data: [],
      });
    }

    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { nameAr: { contains: q } },
        ],
        isAvailable: true,
      },
      select: {
        nameAr: true,
        name: true,
      },
      take: 10,
      orderBy: { rating: 'desc' },
    });

    // Deduplicate and return name strings (prefer Arabic names)
    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const product of products) {
      const name = product.nameAr || product.name;
      if (name && !seen.has(name)) {
        seen.add(name);
        suggestions.push(name);
      }
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('[Search Suggestions API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب اقتراحات البحث',
        message_en: 'An error occurred while fetching search suggestions',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}