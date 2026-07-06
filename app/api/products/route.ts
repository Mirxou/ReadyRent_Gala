import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Products API — Ready for real backend integration
// Currently returns 501 (Not Implemented) until backend is connected
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  // When a real backend is connected, forward the request with query params:
  // search, category, location, min_price, max_price, availability, ordering
  void request; // acknowledge request params are available

  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: 'قائمة المنتجات غير متاحة حالياً — قيد التطوير',
      message_en: 'Products list not yet available — under development',
      code: 'NOT_IMPLEMENTED',
    },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  // When a real backend is connected, forward the request body
  void request;

  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: 'إنشاء منتج غير متاح حالياً — قيد التطوير',
      message_en: 'Product creation not yet available — under development',
      code: 'NOT_IMPLEMENTED',
    },
    { status: 501 }
  );
}