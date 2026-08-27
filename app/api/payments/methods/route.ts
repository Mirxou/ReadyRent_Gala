// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Payment Methods API
// GET /api/payments/methods
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const methods = [
      {
        type: 'baridimob',
        display_name: 'بريدي موب',
        description: 'الدفع عبر تطبيق بريدي موب',
        icon: 'phone',
      },
      {
        type: 'card',
        display_name: 'بطاقة بنكية',
        description: 'بطاقة بنكية عبر Chargily',
        icon: 'credit-card',
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
      { status: 500 }
    );
  }
}
