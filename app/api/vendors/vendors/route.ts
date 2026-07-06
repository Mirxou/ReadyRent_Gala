import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Vendors API — Ready for real backend integration
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  // When a real backend is connected, forward: location, search
  void request;

  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: 'قائمة البائعين غير متاحة حالياً — قيد التطوير',
      message_en: 'Vendors list not yet available — under development',
      code: 'NOT_IMPLEMENTED',
    },
    { status: 501 }
  );
}