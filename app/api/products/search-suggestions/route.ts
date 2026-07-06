import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Product Search Suggestions API — Ready for real backend integration
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: 'اقتراحات البحث غير متاحة حالياً — قيد التطوير',
      message_en: 'Search suggestions not yet available — under development',
      code: 'NOT_IMPLEMENTED',
    },
    { status: 501 }
  );
}