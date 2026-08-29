// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Social Feed API
// GET /api/social/feed
// Returns rich activity items with userName, action, type fields
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Fetch recent vouches with sender and receiver info (last 20)
    const vouches = await db.socialVouch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            trustScore: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            trustScore: true,
          },
        },
      },
    });

    const data = vouches.map((v) => {
      const senderName =
        `${v.sender.firstName || ''} ${v.sender.lastName || ''}`.trim() ||
        v.sender.username ||
        'مستخدم';
      const receiverName =
        `${v.receiver.firstName || ''} ${v.receiver.lastName || ''}`.trim() ||
        v.receiver.username ||
        'مستخدم';

      return {
        id: v.id,
        created_at: v.createdAt.toISOString(),
        userName: senderName,
        action: `ضَمِن لـ${receiverName}`,
        type: 'vouch',
        sender: {
          id: v.sender.id,
          name: senderName,
          username: v.sender.username,
          trust_score: v.sender.trustScore,
        },
        receiver: {
          id: v.receiver.id,
          name: receiverName,
          username: v.receiver.username,
          trust_score: v.receiver.trustScore,
        },
      };
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch (error) {
    logger.error('Social Feed', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب آخر الأنشطة',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
