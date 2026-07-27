import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// POST /api/verification/vote — Vote on a verification (approve/reject)
// All writes wrapped in a single $transaction to prevent race conditions
// ═══════════════════════════════════════════════════════════════════
export async function POST(request: Request) {
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
        { success: false, dignity_preserved: true, message_ar: 'يجب أن تكون موثقاً للتصويت', message_en: 'You must be verified to vote' },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();
    const { verification_id, vote, comment } = body as {
      verification_id?: string;
      vote?: string;
      comment?: string;
    };

    if (!verification_id) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'معرف التحقق مطلوب', message_en: 'Verification ID is required' },
        { status: 400 }
      );
    }

    if (vote !== 'approve' && vote !== 'reject') {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'التصويت يجب أن يكون "approve" أو "reject"', message_en: 'Vote must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // ──── Atomic transaction: all writes in one operation ────
    const result = await db.$transaction(async (tx) => {
      // 1. Find and lock the verification record
      const verification = await tx.identityVerification.findUnique({
        where: { id: verification_id },
      });

      if (!verification) {
        return { error: 'NOT_FOUND' } as const;
      }

      if (verification.status !== 'community_review' && verification.status !== 'ai_approved') {
        return { error: 'WRONG_STAGE' } as const;
      }

      // 2. Check duplicate vote (inside transaction for atomicity)
      const existingVote = await tx.verificationVote.findUnique({
        where: {
          verificationId_voterId: {
            verificationId: verification_id,
            voterId: session.userId,
          },
        },
      });

      if (existingVote) {
        return { error: 'ALREADY_VOTED' } as const;
      }

      // 3. Create vote + update counts + check thresholds — all atomic
      const newApprovalCount = verification.approvalCount + (vote === 'approve' ? 1 : 0);
      const newRejectionCount = verification.rejectionCount + (vote === 'reject' ? 1 : 0);

      let newStatus = verification.status;
      let verifiedAt: Date | null = verification.verifiedAt;
      let reviewedAt: Date | null = verification.reviewedAt;
      let rejectionReason: string | null = verification.rejectionReason;
      let shouldVerifyUser = false;
      let notificationData: { type: string; title: string; message: string } | null = null;

      // Transition ai_approved → community_review on first vote
      if (verification.status === 'ai_approved') {
        newStatus = 'community_review';
      }

      // Check thresholds
      if (newApprovalCount >= verification.requiredApprovals) {
        newStatus = 'verified';
        verifiedAt = new Date();
        shouldVerifyUser = true;
        notificationData = {
          type: 'trust',
          title: 'تم توثيق هويتك بنجاح!',
          message: `تهانينا! تم توثيق هويتك بعد حصولك على ${newApprovalCount} موافقات. رصيد الثقة +15 نقطة.`,
        };
      } else if (newRejectionCount >= 3) {
        newStatus = 'rejected';
        reviewedAt = new Date();
        rejectionReason = `مرفوض من المجتمع (${newRejectionCount} رفض)`;
        notificationData = {
          type: 'trust',
          title: 'تم رفض طلب التحقق',
          message: `لم يتم الموافقة على طلب التحقق بعد حصوله على ${newRejectionCount} رفض. يمكنك إعادة المحاولة.`,
        };
      }

      // 4. Execute all writes atomically
      await tx.verificationVote.create({
        data: {
          verificationId: verification_id,
          voterId: session.userId,
          vote,
          comment: comment || null,
        },
      });

      await tx.identityVerification.update({
        where: { id: verification_id },
        data: {
          status: newStatus,
          approvalCount: newApprovalCount,
          rejectionCount: newRejectionCount,
          verifiedAt,
          reviewedAt,
          rejectionReason,
        },
      });

      if (shouldVerifyUser) {
        await tx.user.update({
          where: { id: verification.userId },
          data: { isVerified: true, trustScore: { increment: 15 } },
        });
      }

      if (notificationData) {
        await tx.notification.create({
          data: {
            userId: verification.userId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
          },
        });
      }

      return {
        success: true,
        data: {
          id: verification_id,
          status: newStatus,
          approval_count: newApprovalCount,
          rejection_count: newRejectionCount,
          required_approvals: verification.requiredApprovals,
          verified_at: verifiedAt?.toISOString() || null,
          reviewed_at: reviewedAt?.toISOString() || null,
        },
      };
    });

    if ('error' in result) {
      const errorMap: Record<string, { ar: string; en: string; status: number }> = {
        NOT_FOUND: { ar: 'طلب التحقق غير موجود', en: 'Verification request not found', status: 404 },
        WRONG_STAGE: { ar: 'هذا الطلب ليس في مرحلة مراجعة المجتمع', en: 'This request is not in community review stage', status: 409 },
        ALREADY_VOTED: { ar: 'لقد صوتت بالفعل على هذا الطلب', en: 'You have already voted on this request', status: 409 },
      };
      const err = errorMap[result.error];
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: err.ar, message_en: err.en },
        { status: err.status }
      );
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: result.data,
    });
  } catch {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'حدث خطأ أثناء تسجيل التصويت', message_en: 'An error occurred while casting the vote' },
      { status: 500 }
    );
  }
}
