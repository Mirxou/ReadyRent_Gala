import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Create Review API — Submit a new review (status: pending)
// ═══════════════════════════════════════════════════════════════════

function errorResponse(
  messageAr: string,
  messageEn: string,
  code: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: messageAr,
      message_en: messageEn,
      code,
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const session = getSessionFromRequest(request);
    if (!session) {
      return errorResponse(
        'يجب تسجيل الدخول لإضافة تقييم',
        'You must be logged in to submit a review',
        'UNAUTHORIZED',
        401
      );
    }

    const body = await request.json();
    const { product_id, rating, comment, title } = body;

    // Validate required fields
    if (!product_id || !rating) {
      return errorResponse(
        'معرف المنتج والتقييم مطلوبان',
        'Product ID and rating are required',
        'MISSING_PARAMS',
        400
      );
    }

    // Validate rating range
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return errorResponse(
        'التقييم يجب أن يكون بين 1 و 5',
        'Rating must be between 1 and 5',
        'INVALID_RATING',
        400
      );
    }

    // Verify product exists
    const product = await db.product.findUnique({
      where: { id: product_id },
      select: { id: true, nameAr: true },
    });

    if (!product) {
      return errorResponse(
        'المنتج غير موجود',
        'Product not found',
        'NOT_FOUND',
        404
      );
    }

    // Get user info for reviewer name
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { username: true, firstName: true, lastName: true },
    });

    const reviewerName = title || user?.username || user?.firstName || 'مستخدم مجهول';

    // Create review
    const review = await db.review.create({
      data: {
        userId: session.userId,
        productId: product_id,
        reviewerName,
        rating: ratingNum,
        comment: comment || null,
        isVerified: false,
        status: 'pending',
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: review.id,
        user_id: review.userId,
        product_id: review.productId,
        reviewer_name: review.reviewerName,
        rating: review.rating,
        comment: review.comment ?? null,
        is_verified: review.isVerified,
        status: review.status,
        created_at: review.createdAt.toISOString(),
        user: review.user
          ? { id: review.user.id, username: review.user.username }
          : null,
      },
    });
  } catch (error) {
    console.error('[Create Review API] Error:', error);
    return errorResponse(
      'حدث خطأ أثناء إنشاء التقييم',
      'An error occurred while creating the review',
      'INTERNAL_ERROR',
      500
    );
  }
}