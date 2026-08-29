// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Social Vouch API
// POST /api/social/vouch/[userId]
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { recalcAndSyncTrustScore } from '@/lib/trust-score-sync';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // Sender must be verified to vouch
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { isVerified: true },
    });
    if (!currentUser || !currentUser.isVerified) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'يجب أن تكون موثقاً للتصويت لصالح مستخدم آخر',
          code: 'NOT_VERIFIED',
        },
        { status: 403 }
      );
    }

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

    // Cap: max 20 received vouches
    const existingVouchCount = await db.socialVouch.count({
      where: { receiverId },
    });
    if (existingVouchCount >= 20) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'وصل هذا المستخدم إلى الحد الأقصى من التوصيات',
          code: 'MAX_VOUCHES_REACHED',
        },
        { status: 400 }
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

    // Create vouch
    await db.socialVouch.create({
      data: {
        senderId: session.userId,
        receiverId: receiverId,
      },
    });

    // Recalculate trust score for the recipient (fire-and-forget)
    recalcAndSyncTrustScore(receiverId).catch(() => {});

    const newVouchCount = existingVouchCount + 1;

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        vouch_count: newVouchCount,
        message_ar: 'تم التصويت لصالح المستخدم بنجاح',
      },
    });
  } catch (error) {
    logger.error('Social Vouch', 'Error', error);
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
