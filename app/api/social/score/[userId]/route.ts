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

    // Fetch all breakdown data in parallel
    const [vouchCount, totalBookings, completedBookings, totalDisputes, favorableDisputes] =
      await Promise.all([
        db.socialVouch.count({ where: { receiverId: userId } }),

        db.booking.count({
          where: {
            userId,
            status: { in: ['confirmed', 'active', 'completed', 'cancelled'] },
          },
        }),

        db.booking.count({
          where: { userId, status: 'completed' },
        }),

        db.dispute.count({
          where: { userId },
        }),

        db.dispute.count({
          where: {
            userId,
            status: { in: ['resolved', 'closed'] },
          },
        }),
      ]);

    // Build breakdown from real data
    const breakdown = {
      // Completed bookings / total meaningful bookings. Base score of 70 for new users.
      payment_reliability:
        totalBookings === 0
          ? 70
          : Math.round((completedBookings / totalBookings) * 100),

      // Favorable disputes (resolved/closed) / total disputes. No disputes = 95 (good).
      dispute_history:
        totalDisputes === 0
          ? 95
          : Math.round((favorableDisputes / totalDisputes) * 100),

      verification_level: user.isVerified ? 100 : 30,

      community_vouches: Math.min(vouchCount * 15, 100),

      // More completed rentals = higher score. 10+ completed = 100.
      rental_history: Math.min(completedBookings * 10, 100),
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
