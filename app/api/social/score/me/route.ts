// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — My Trust Score API
// GET /api/social/score/me/
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { recalcAndSyncTrustScore } from '@/lib/trust-score-sync';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const { db } = await import('@/lib/db');

    // Recalculate trust score and sync to Vendor records (single source of truth)
    const breakdown = await recalcAndSyncTrustScore(session.userId);

    // Fetch display counts
    const [vouchCount, userProducts] = await Promise.all([
      db.socialVouch.count({ where: { receiverId: session.userId } }),
      db.product.findMany({ where: { vendorId: session.userId }, select: { id: true } }),
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

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        overall_score: breakdown.overall,
        is_verified: breakdown.verification > 0,
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
