// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Payment Methods API
// GET /api/payments/methods
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const hasChargily = !!process.env.CHARGILY_API_KEY;

    const methods = [
      ...(hasChargily
        ? [{
            type: 'card',
            display_name: 'بطاقة بنكية',
            description: 'CIB / Edahabia عبر Chargily Pay',
            icon: 'credit-card',
            available: true,
          }]
        : []),
      {
        type: 'baridimob',
        display_name: 'بريدي موب',
        description: 'الدفع عبر تطبيق بريدي موب — قريبًا',
        icon: 'phone',
        available: false,
      },
    ];

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: methods,
    });
  } catch (error) {
    logger.error('Payment Methods', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب طرق الدفع',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
