import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { readValidatedBody } from '@/lib/rate-limiter';

// ═══════════════════════════════════════════════════════════════
// POST /api/verification/submit — Submit face photo for verification
// VLM analysis is unavailable; stores null and flags for manual review
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // Parse body with size limit (5MB max for base64 face photo)
    const bodyResult = await readValidatedBody(request, 5 * 1024 * 1024);
    if ('error' in bodyResult) {
      return NextResponse.json(bodyResult, { status: bodyResult.status });
    }
    const body = JSON.parse(bodyResult.text);
    const { face_photo } = body as { face_photo?: string };

    if (!face_photo || typeof face_photo !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'صورة الوجه مطلوبة',
          message_en: 'Face photo is required',
        },
        { status: 400 }
      );
    }

    // Validate data URL format (block SVG — stored XSS risk)
    if (!face_photo.startsWith('data:image/')) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'صيغة الصورة غير صالحة',
          message_en: 'Invalid image format',
        },
        { status: 400 }
      );
    }

    // Block SVG explicitly — SVG can contain embedded JavaScript (stored XSS)
    const ALLOWED_MIME_PREFIXES = ['data:image/jpeg', 'data:image/png', 'data:image/webp', 'data:image/gif'];
    if (!ALLOWED_MIME_PREFIXES.some(prefix => face_photo.startsWith(prefix))) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP أو GIF',
          message_en: 'Unsupported image format. Use JPG, PNG, WebP, or GIF',
        },
        { status: 400 }
      );
    }

    // Check if user already has an active verification request
    const existing = await db.identityVerification.findUnique({
      where: { userId: session.userId },
    });

    if (existing && existing.status !== 'rejected' && existing.status !== 'ai_rejected') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لديك طلب تحقق قيد المراجعة بالفعل',
          message_en: 'You already have a verification request under review',
        },
        { status: 409 }
      );
    }

    // If previously rejected/ai_rejected, delete old record to allow resubmission
    if (existing && (existing.status === 'rejected' || existing.status === 'ai_rejected')) {
      await db.verificationVote.deleteMany({ where: { verificationId: existing.id } });
      await db.identityVerification.delete({ where: { id: existing.id } });
    }

    // VLM analysis is not available — store null and set status to 'pending' for manual review
    const aiAnalysis = null;
    const aiScore = 0;
    const status = 'pending';

    // Create IdentityVerification record
    const verification = await db.identityVerification.create({
      data: {
        userId: session.userId,
        facePhoto: face_photo,
        status,
        aiAnalysis,
        aiScore,
      },
    });

    // Notify the user that their request is under manual review
    await db.notification.create({
      data: {
        userId: session.userId,
        type: 'trust',
        title: 'تم استلام طلب التحقق',
        message: 'تم استلام صورتك بنجاح وسيتم مراجعتها يدوياً من قبل فريقنا.',
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: verification.id,
        status: verification.status,
        ai_score: verification.aiScore,
        ai_analysis: null,
        required_approvals: verification.requiredApprovals,
        created_at: verification.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('POST /api/verification/submit', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء معالجة طلب التحقق',
        message_en: 'An error occurred while processing the verification request',
      },
      { status: 500 }
    );
  }
}
