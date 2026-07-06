import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// Reviews API — List reviews for a product
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const productId = searchParams.get('product_id');
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') || 'approved';

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'معرف المنتج مطلوب',
          message_en: 'Product ID is required',
          code: 'MISSING_PARAMS',
        },
        { status: 400 }
      );
    }

    const reviews = await db.review.findMany({
      where: {
        productId,
        status,
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: reviews.map((review) => ({
        id: review.id,
        user_id: review.userId,
        booking_id: review.bookingId ?? null,
        product_id: review.productId,
        reviewer_name: review.reviewerName,
        rating: review.rating,
        comment: review.comment ?? null,
        is_verified: review.isVerified,
        status: review.status,
        created_at: review.createdAt.toISOString(),
        user: review.user
          ? { id: review.user.id, username: review.user.username }
          : null,
      })),
    });
  } catch (error) {
    console.error('[Reviews API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب التقييمات',
        message_en: 'An error occurred while fetching reviews',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}