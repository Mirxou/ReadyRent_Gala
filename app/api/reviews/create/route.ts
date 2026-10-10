import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { checkCreateRateLimit, getClientIp } from '@/lib/rate-limiter';
import { recalcVendorTrustScore } from '@/lib/trust-score-sync';

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
    // ── Rate limiting ──
    const clientIp = getClientIp(request);
    const rateCheck = checkCreateRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return errorResponse(
        'محاولات كثيرة. حاول بعد قليل.',
        'Too many requests. Please try again later.',
        'RATE_LIMITED',
        429
      );
    }

    // Check auth
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse(
        'يجب تسجيل الدخول لإضافة تقييم',
        'You must be logged in to submit a review',
        'UNAUTHORIZED',
        401
      );
    }

    const body = await request.json();
    const { product_id, booking_id, rating, comment, title } = body;

    // Validate required fields — PHASE 2: booking_id is the trust anchor.
    if (!product_id || !rating || !booking_id) {
      return errorResponse(
        'معرف المنتج والحجز والتقييم مطلوبة',
        'Product ID, booking ID and rating are required',
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

    // Verify product exists and get vendorId
    const product = await db.product.findUnique({
      where: { id: product_id },
      select: { id: true, nameAr: true, vendorId: true },
    });

    if (!product) {
      return errorResponse(
        'المنتج غير موجود',
        'Product not found',
        'NOT_FOUND',
        404
      );
    }

    // ── GRAFT PHASE 2: the COMPLETED gate — no booking, no review ──
    // A review is a privilege earned by a finished rental. The chain:
    // booking exists → renter owns it → same product → status completed.
    const booking = await db.booking.findUnique({
      where: { id: booking_id },
      select: { id: true, userId: true, productId: true, status: true },
    });

    if (!booking) {
      return errorResponse(
        'الحجز غير موجود',
        'Booking not found',
        'BOOKING_NOT_FOUND',
        404
      );
    }

    if (booking.userId !== session.userId) {
      return errorResponse(
        'لا يمكنك تقييم حجز لا تملكه',
        'You can only review your own bookings',
        'BOOKING_FORBIDDEN',
        403
      );
    }

    if (booking.productId !== product_id) {
      return errorResponse(
        'التقييم لا يطابق منتج الحجز',
        'Review does not match the booked product',
        'BOOKING_MISMATCH',
        400
      );
    }

    if (booking.status !== 'completed') {
      return errorResponse(
        'لا يمكن التقييم إلا بعد اكتمال الحجز وتحرير الضمان',
        'Only completed bookings (escrow released) can be reviewed',
        'BOOKING_NOT_COMPLETED',
        403
      );
    }

    // One review per booking — DB enforces @@unique([bookingId]); pre-check
    // gives a friendly 409 instead of a raw constraint error.
    const existingReview = await db.review.findFirst({
      where: { bookingId: booking.id },
      select: { id: true },
    });
    if (existingReview) {
      return errorResponse(
        'قيمت هذا الحجز مسبقاً — تقييم واحد لكل حجز',
        'You already reviewed this booking — one review per booking',
        'ALREADY_REVIEWED',
        409
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
        bookingId: booking.id,
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

    // Recalculate vendor trust score after review (fire-and-forget)
    // P1 fix: was `.catch(() => {})` — silently swallowed errors so a stale
    // trust score could persist forever. Now we log + the offline-queue can retry.
    if (product.vendorId) {
      recalcVendorTrustScore(product.vendorId).catch((e: unknown) => {
        logger.error('TrustScore', `Failed to recalc vendor trust score for vendor ${product.vendorId} after review ${review.id}`, e);
      });
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: review.id,
        user_id: review.userId,
        product_id: review.productId,
        booking_id: review.bookingId,
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
    logger.error('Create Review API', 'Error', error);
    return errorResponse(
      'حدث خطأ أثناء إنشاء التقييم',
      'An error occurred while creating the review',
      'INTERNAL_ERROR',
      500
    );
  }
}