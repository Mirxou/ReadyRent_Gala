import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import ZAI from 'z-ai-web-dev-sdk';

// ═══════════════════════════════════════════════════════════════
// POST /api/verification/submit — Submit face photo for AI verification
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // Parse body
    const body = await request.json();
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

    // Validate data URL format
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

    // Analyze face photo with VLM
    const zai = await ZAI.create();

    const vlmPrompt = `You are a face verification AI for STANDARD.Rent platform (Algeria). Analyze this photo and respond ONLY with valid JSON: { "is_real_face": boolean, "face_quality": "high"|"medium"|"low", "face_visible": boolean, "has_multiple_faces": boolean, "confidence_score": 0-100, "issues": string[], "recommendation": "approve"|"reject" }`;

    const vlmResponse = await zai.chat.completions.createVision({
      model: 'default',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: vlmPrompt },
            { type: 'image_url', image_url: { url: face_photo } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const rawContent = vlmResponse.choices?.[0]?.message?.content || '{}';

    // Parse AI response — handle potential markdown wrapping
    let aiResult: {
      is_real_face?: boolean;
      face_quality?: string;
      face_visible?: boolean;
      has_multiple_faces?: boolean;
      confidence_score?: number;
      issues?: string[];
      recommendation?: string;
    };

    try {
      const jsonStr = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResult = JSON.parse(jsonStr);
    } catch {
      aiResult = {
        is_real_face: false,
        face_quality: 'low',
        face_visible: false,
        has_multiple_faces: false,
        confidence_score: 0,
        issues: ['فشل تحليل الصورة بالذكاء الاصطناعي'],
        recommendation: 'reject',
      };
    }

    const confidence = typeof aiResult.confidence_score === 'number' ? aiResult.confidence_score : 0;
    const recommendation = aiResult.recommendation || 'reject';

    // Determine status
    const status =
      recommendation === 'approve' && confidence >= 60 ? 'ai_approved' : 'ai_rejected';

    // Create IdentityVerification record
    const verification = await db.identityVerification.create({
      data: {
        userId: session.userId,
        facePhoto: face_photo,
        status,
        aiAnalysis: JSON.stringify(aiResult),
        aiScore: confidence,
      },
    });

    // If AI approved, create notification for the user
    if (status === 'ai_approved') {
      await db.notification.create({
        data: {
          userId: session.userId,
          type: 'trust',
          title: 'تم تمرير التحقق بالذكاء الاصطناعي',
          message: `تهانينا! اجتازت صورتك فحص الذكاء الاصطناعي (${confidence}%). الآن في انتظار مراجعة المجتمع (5 موافقات مطلوبة).`,
        },
      });
    } else {
      await db.notification.create({
        data: {
          userId: session.userId,
          type: 'trust',
          title: 'لم يجتز التحقق بالذكاء الاصطناعي',
          message: `لم تتم الموافقة على صورتك (${confidence}%). يمكنك إعادة المحاولة. الأسباب: ${(aiResult.issues || []).join(', ')}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: verification.id,
        status: verification.status,
        ai_score: verification.aiScore,
        ai_analysis: aiResult,
        required_approvals: verification.requiredApprovals,
        created_at: verification.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[POST /api/verification/submit] Error:', error);
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