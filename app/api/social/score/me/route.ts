// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — My Trust Score API
// GET /api/social/score/me
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { calculateTrustBreakdown } from '@/lib/trust-score';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const userId = session.userId;

    // Fetch user basic info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'المستخدم غير موجود', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch data for trust calculation in parallel
    const [vouchCount, userProducts] = await Promise.all([
      db.socialVouch.count({ where: { receiverId: userId } }),
      db.product.findMany({ where: { vendorId: userId }, select: { id: true } }),
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

    const breakdown = calculateTrustBreakdown({
      isVerified: user.isVerified,
      avgRating,
      reviewCount,
      vouchCount,
    });

    // Also update User.trustScore in DB for other consumers
    await db.user.update({
      where: { id: userId },
      data: { trustScore: breakdown.overall },
    }).catch(() => {
      // Non-critical — don't fail the request
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
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
      },
    });
  } catch (error) {
    logger.error('Social Score Me', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'حدث خطأ أثناء جلب نقاط الثقة', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
