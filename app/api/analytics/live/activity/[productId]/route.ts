import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Live Activity — Real booking-based interest count for a product
// ═══════════════════════════════════════════════════════════════════

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'معرف المنتج مطلوب',
          message_en: 'Product ID is required',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    // Count active bookings as a proxy for live interest
    const activeBookings = await db.booking.count({
      where: {
        productId,
        status: { in: ['pending', 'confirmed', 'active'] },
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        viewers: activeBookings,
        isLive: false,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في جلب بيانات النشاط',
        message_en: 'Error fetching live activity',
        code: 'LIVE_ACTIVITY_ERROR',
      },
      { status: 500 }
    );
  }
}
