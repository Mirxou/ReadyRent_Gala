// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Social Feed API
// GET /api/social/feed
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    const data = vouches.map((v) => ({
      id: v.id,
      created_at: v.createdAt.toISOString(),
      sender: {
        id: v.sender.id,
        name: `${v.sender.firstName || ''} ${v.sender.lastName || ''}`.trim() || v.sender.username,
        username: v.sender.username,
      },
      receiver: {
        id: v.receiver.id,
        name: `${v.receiver.firstName || ''} ${v.receiver.lastName || ''}`.trim() || v.receiver.username,
        username: v.receiver.username,
      },
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch (error) {
    console.error('[Social Feed] Error:', error);
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
