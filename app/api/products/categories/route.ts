import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Product Categories API — Ready for real backend integration
// ═══════════════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: 'قائمة التصنيفات غير متاحة حالياً — قيد التطوير',
      message_en: 'Categories list not yet available — under development',
      code: 'NOT_IMPLEMENTED',
    },
    { status: 501 }
  );
}