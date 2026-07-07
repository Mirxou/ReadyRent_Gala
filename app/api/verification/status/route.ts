import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/verification/status — Get current user's verification status
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const verification = await db.identityVerification.findUnique({
      where: { userId: session.userId },
      include: {
        votes: {
          include: {
            voter: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!verification) {
      return NextResponse.json({
        success: true,
        dignity_preserved: true,
        data: { status: 'not_submitted' },
      });
    }

    // Parse AI analysis if present
    let aiAnalysisParsed = null;
    if (verification.aiAnalysis) {
      try {
        aiAnalysisParsed = JSON.parse(verification.aiAnalysis);
      } catch {
        aiAnalysisParsed = null;
      }
    }

    const votes = verification.votes.map((v) => ({
      voter_id: v.voter.id,
      voter_username: v.voter.username,
      voter_first_name: v.voter.firstName,
      voter_last_name: v.voter.lastName,
      vote: v.vote,
      comment: v.comment,
      created_at: v.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: verification.id,
        status: verification.status,
        ai_score: verification.aiScore,
        ai_analysis: aiAnalysisParsed,
        approval_count: verification.approvalCount,
        rejection_count: verification.rejectionCount,
        required_approvals: verification.requiredApprovals,
        rejection_reason: verification.rejectionReason,
        verified_at: verification.verifiedAt?.toISOString() || null,
        reviewed_at: verification.reviewedAt?.toISOString() || null,
        created_at: verification.createdAt.toISOString(),
        updated_at: verification.updatedAt.toISOString(),
        votes,
      },
    });
  } catch (error) {
    console.error('[GET /api/verification/status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب حالة التحقق',
        message_en: 'An error occurred while fetching verification status',
      },
      { status: 500 }
    );
  }
}