// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Public Trust Score API
// GET /api/social/score/[userId]
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { calculateTrustBreakdown } from '@/lib/trust-score';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'معرف المستخدم مطلوب',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Fetch user basic info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'المستخدم غير موجود',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Fetch data needed for trust calculation in parallel
    const [vouchCount, userProducts] = await Promise.all([
      db.socialVouch.count({ where: { receiverId: userId } }),
      db.product.findMany({
        where: { vendorId: userId },
        select: { id: true },
      }),
    ]);

    const productIds = userProducts.map(p => p.id);

    let avgRating = 0;
    let reviewCount = 0;

    if (productIds.length > 0) {
      const reviewStats = await db.review.aggregate({
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: true,
      });
      avgRating = reviewStats._avg.rating ?? 0;
      reviewCount = reviewStats._count;
    }

    // Calculate trust score using the MVP algorithm
    const breakdown = calculateTrustBreakdown({
      isVerified: user.isVerified,
      avgRating,
      reviewCount,
      vouchCount,
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        user_id: userId,
        overall_score: breakdown.overall,
        is_verified: user.isVerified,
        vouch_count: vouchCount,
        review_count: reviewCount,
        avg_rating: Math.round(avgRating * 10) / 10,
        components: {
          verification: breakdown.verification,
          rating: breakdown.rating,
          vouches: breakdown.vouches,
        },
        tier: breakdown.level.tier,
        tier_label: breakdown.level.label,
        tier_color: breakdown.level.color,
      },
    });
  } catch (error) {
    logger.error('Social Score', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب نقاط الثقة',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
