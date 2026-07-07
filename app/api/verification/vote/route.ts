import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/verification/vote — Vote on a verification (approve/reject)
// ═══════════════════════════════════════════════════════════════
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
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'يجب أن تكون موثقاً للتصويت',
          message_en: 'You must be verified to vote',
        },
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
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'معرف التحقق مطلوب',
          message_en: 'Verification ID is required',
        },
        { status: 400 }
      );
    }

    if (vote !== 'approve' && vote !== 'reject') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'التصويت يجب أن يكون "approve" أو "reject"',
          message_en: 'Vote must be "approve" or "reject"',
        },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await db.identityVerification.findUnique({
      where: { id: verification_id },
    });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'طلب التحقق غير موجود',
          message_en: 'Verification request not found',
        },
        { status: 404 }
      );
    }

    if (verification.status !== 'community_review') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'هذا الطلب ليس في مرحلة مراجعة المجتمع',
          message_en: 'This request is not in community review stage',
        },
        { status: 409 }
      );
    }

    // Check if user already voted
    const existingVote = await db.verificationVote.findUnique({
      where: {
        verificationId_voterId: {
          verificationId: verification_id,
          voterId: session.userId,
        },
      },
    });

    if (existingVote) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لقد صوتت بالفعل على هذا الطلب',
          message_en: 'You have already voted on this request',
        },
        { status: 409 }
      );
    }

    // Create the vote record
    await db.verificationVote.create({
      data: {
        verificationId: verification_id,
        voterId: session.userId,
        vote,
        comment: comment || null,
      },
    });

    // Update the verification counts
    const updatedVerification = await db.identityVerification.update({
      where: { id: verification_id },
      data:
        vote === 'approve'
          ? { approvalCount: { increment: 1 } }
          : { rejectionCount: { increment: 1 } },
    });

    // Check thresholds
    const approvalCount = updatedVerification.approvalCount;
    const rejectionCount = updatedVerification.rejectionCount;
    const requiredApprovals = updatedVerification.requiredApprovals;

    if (approvalCount >= requiredApprovals) {
      // User is now fully verified
      await db.identityVerification.update({
        where: { id: verification_id },
        data: {
          status: 'verified',
          verifiedAt: new Date(),
        },
      });

      await db.user.update({
        where: { id: verification.userId },
        data: {
          isVerified: true,
          trustScore: { increment: 15 },
        },
      });

      await db.notification.create({
        data: {
          userId: verification.userId,
          type: 'trust',
          title: 'تم توثيق هويتك بنجاح!',
          message: `تهانينا! تم توثيق هويتك بعد حصولك على ${approvalCount} موافقات. رصيد الثقة +15 نقطة. أنت الآن مستخدم موثوق في STANDARD.Rent.`,
        },
      });
    } else if (rejectionCount >= 3) {
      // Rejected by community
      await db.identityVerification.update({
        where: { id: verification_id },
        data: {
          status: 'rejected',
          reviewedAt: new Date(),
          rejectionReason: `مرفوض من المجتمع (${rejectionCount} رفض)`,
        },
      });

      await db.notification.create({
        data: {
          userId: verification.userId,
          type: 'trust',
          title: 'تم رفض طلب التحقق',
          message: `لم يتم الموافقة على طلب التحقق الخاص بك بعد حصوله على ${rejectionCount} رفض. يمكنك إعادة المحاولة.`,
        },
      });
    }

    // Fetch the latest verification state for the response
    const finalVerification = await db.identityVerification.findUnique({
      where: { id: verification_id },
      select: {
        id: true,
        status: true,
        approvalCount: true,
        rejectionCount: true,
        requiredApprovals: true,
        verifiedAt: true,
        reviewedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: finalVerification!.id,
        status: finalVerification!.status,
        approval_count: finalVerification!.approvalCount,
        rejection_count: finalVerification!.rejectionCount,
        required_approvals: finalVerification!.requiredApprovals,
        verified_at: finalVerification!.verifiedAt?.toISOString() || null,
        reviewed_at: finalVerification!.reviewedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('[POST /api/verification/vote] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء تسجيل التصويت',
        message_en: 'An error occurred while casting the vote',
      },
      { status: 500 }
    );
  }
}