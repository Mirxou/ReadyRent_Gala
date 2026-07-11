// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Payment Methods API
// GET /api/payments/methods
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const methods = [
      {
        id: 'baridimob',
        name: 'بريدي موب',
        icon: 'phone',
        fee: 0,
        enabled: true,
      },
      {
        id: 'ccp',
        name: 'حساب بريدي CCP',
        icon: 'building',
        fee: 0,
        enabled: true,
      },
      {
        id: 'bank_card',
        name: 'بطاقة بنكية',
        icon: 'credit-card',
        fee: 2.5,
        enabled: true,
      },
      {
        id: 'wallet',
        name: 'المحفظة الرقمية',
        icon: 'wallet',
        fee: 0,
        enabled: true,
      },
    ];

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: methods,
    });
  } catch (error) {
    console.error('[Payment Methods] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب طرق الدفع',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
