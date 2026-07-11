// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Social Trust Score API
// GET /api/social/score/[userId]
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    // Fetch user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        trustScore: true,
        isVerified: true,
      },
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

    // Count vouches
    const vouchCount = await db.socialVouch.count({
      where: { receiverId: userId },
    });

    // Build breakdown with mock component scores
    const breakdown = {
      payment_reliability: Math.round(user.trustScore * 0.3),
      dispute_history: Math.round(user.trustScore * 0.2),
      verification_level: user.isVerified ? 100 : 0,
      community_vouches: Math.min(vouchCount * 10, 100),
      rental_history: Math.round(user.trustScore * 0.3),
    };

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        user_id: userId,
        trust_score: user.trustScore,
        is_verified: user.isVerified,
        vouch_count: vouchCount,
        breakdown,
      },
    });
  } catch (error) {
    console.error('[Social Score] Error:', error);
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
