import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// Live Activity — Viewer count for a product (simulated)
// ═══════════════════════════════════════════════════════════════════

// Simple seeded random so the same product gets a stable-ish number
// within a short window
function getViewers(productId: string): number {
  // Hash the product ID to get a base number
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash << 5) - hash + productId.charCodeAt(i);
    hash |= 0; // Convert to 32-bit int
  }

  // Add time-based jitter (changes every ~30 seconds)
  const timeSlot = Math.floor(Date.now() / 30000);
  hash ^= timeSlot;

  // Map to 1-15 range
  const base = Math.abs(hash % 15) + 1;
  return base;
}

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

    const viewers = getViewers(productId);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        viewers,
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