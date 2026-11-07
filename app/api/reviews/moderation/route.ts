import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/reviews/moderation — Review moderation queue
// MASTERPLAN 2.2: reviews are created as 'pending' and need an
// approval loop. Admin/staff see all reviews, vendors see only
// reviews on their own products. Pair with PATCH
// /api/reviews/[id]/moderate (already live).
// ═══════════════════════════════════════════════════════════════

const VALID_STATUS_FILTERS = ['pending', 'approved', 'rejected', 'all'];

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { searchParams } = request.nextUrl;

    const parsedLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(50, parsedLimit) : 20;
    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const skip = (page - 1) * limit;

    const statusParam = searchParams.get('status') || 'pending';
    if (!VALID_STATUS_FILTERS.includes(statusParam)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'حالة غير صالحة — المسموح: pending, approved, rejected, all',
          message_en: 'Invalid status — allowed: pending, approved, rejected, all',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }
    const statusFilter = statusParam === 'all' ? undefined : statusParam;

    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!currentUser) return authRequiredResponse();

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'staff';

    const where: Record<string, unknown> = {};
    if (statusFilter) where.status = statusFilter;

    if (!isAdmin) {
      // Vendors moderate only reviews on their own products (mirrors
      // the authorization rule in /api/reviews/[id]/moderate)
      if (currentUser.role !== 'vendor') {
        return NextResponse.json(
          {
            success: false,
            dignity_preserved: true,
            message_ar: 'غير مصرح بالوصول لقائمة التقييمات',
            message_en: 'Not authorized to access the moderation queue',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
      where.product = { vendorId: session.userId };
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } },
          product: { select: { id: true, nameAr: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: reviews.map((review) => ({
        id: review.id,
        user_id: review.userId,
        booking_id: review.bookingId ?? null,
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
        product: review.product
          ? {
              id: review.product.id,
              name_ar: review.product.nameAr,
              name: review.product.name,
            }
          : null,
      })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Reviews Moderation API', 'Error', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب قائمة التقييمات',
        message_en: 'An error occurred while fetching the moderation queue',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
