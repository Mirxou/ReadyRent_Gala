import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Chatbot Quick Chat API — Ready for real backend/AI integration
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  void request;

  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: 'خدمة الدردشة غير متاحة حالياً — قيد التطوير',
      message_en: 'Chat service not yet available — under development',
      code: 'NOT_IMPLEMENTED',
    },
    { status: 501 }
  );
}