import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/verification/pending — Get pending verifications queue (verified users only)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // Check that the requesting user is verified
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { isVerified: true },
    });

    if (!currentUser || !currentUser.isVerified) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'يجب أن تكون موثقاً للوصول إلى طلبات التحقق المعلقة',
          message_en: 'You must be verified to access pending verification requests',
        },
        { status: 403 }
      );
    }

    // Find all verifications ready for community review (ai_approved or community_review)
    const pendingVerifications = await db.identityVerification.findMany({
      where: { status: { in: ['ai_approved', 'community_review'] } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        votes: {
          where: { voterId: session.userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter out verifications the current user already voted on
    const notVotedByMe = pendingVerifications.filter((v) => v.votes.length === 0);

    const data = notVotedByMe.map((v) => ({
      id: v.id,
      user: {
        id: v.user.id,
        username: v.user.username,
        first_name: v.user.firstName,
        last_name: v.user.lastName,
      },
      face_photo: v.facePhoto,
      ai_score: v.aiScore,
      approval_count: v.approvalCount,
      rejection_count: v.rejectionCount,
      required_approvals: v.requiredApprovals,
      created_at: v.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
    });
  } catch (error) {
    console.error('[GET /api/verification/pending] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب طلبات التحقق المعلقة',
        message_en: 'An error occurred while fetching pending verification requests',
      },
      { status: 500 }
    );
  }
}