import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Insurance Plans API — Full database integration
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const plans = await db.insurancePlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    const data = plans.map((p) => ({
      id: p.id,
      name_ar: p.nameAr,
      name_en: p.nameEn,
      price: p.price,
      coverage_ar: p.coverageAr,
      coverage_en: p.coverageEn,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch (error) {
    console.error('[Insurance API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب خطط التأمين',
        message_en: 'An error occurred while fetching insurance plans',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}