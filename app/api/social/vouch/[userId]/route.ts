// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Social Vouch API
// POST /api/social/vouch/[userId]
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const { userId: receiverId } = await params;

    if (!receiverId) {
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

    // Can't vouch for yourself
    if (session.userId === receiverId) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لا يمكنك التصويت لصالح نفسك',
          code: 'SELF_VOUCH',
        },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const recipient = await db.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!recipient) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'المستخدم المستلم غير موجود',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if already vouched (unique constraint will also catch this)
    const existingVouch = await db.socialVouch.findUnique({
      where: {
        senderId_receiverId: {
          senderId: session.userId,
          receiverId: receiverId,
        },
      },
    });

    if (existingVouch) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لقد قمت بالتصويت لصالح هذا المستخدم مسبقاً',
          code: 'ALREADY_VOUCHED',
        },
        { status: 400 }
      );
    }

    // Create vouch and increment trust score in a transaction
    await db.$transaction([
      db.socialVouch.create({
        data: {
          senderId: session.userId,
          receiverId: receiverId,
        },
      }),
      db.user.update({
        where: { id: receiverId },
        data: { trustScore: { increment: 5 } },
      }),
    ]);

    // Get new vouch count
    const newVouchCount = await db.socialVouch.count({
      where: { receiverId },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        vouch_count: newVouchCount,
        trust_score_increment: 5,
        message_ar: 'تم التصويت لصالح المستخدم بنجاح',
      },
    });
  } catch (error) {
    console.error('[Social Vouch] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء التصويت، يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
