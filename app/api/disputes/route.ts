import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/disputes — List user's disputes
// P1 fix: added pagination (skip+take+count) — was unbounded findMany
// Optional filters: ?status=filed&limit=20&page=1
// ═══════════════════════════════════════════════════════════════

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;

    // P1 fix: parse + sanitize pagination params
    let page = parseInt(url.searchParams.get('page') || '1', 10);
    let limit = parseInt(url.searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { userId: session.userId },
        {
          booking: {
            product: { vendorId: session.userId },
          },
        },
      ],
      ...(status ? { status } : {}),
    };

    const [disputes, total] = await Promise.all([
      db.dispute.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true, productName: true, productImage: true, totalPrice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.dispute.count({ where }),
    ]);

    const data = disputes.map((d) => ({
      id: d.id,
      user_id: d.userId,
      booking_id: d.bookingId,
      title: d.title,
      description: d.description,
      claim_type: d.claimType,
      status: d.status,
      priority: d.priority,
      claimed_amount: d.claimedAmount,
      evidence_urls: d.evidenceUrls ? JSON.parse(d.evidenceUrls) : [],
      created_at: d.createdAt.toISOString(),
      updated_at: d.updatedAt.toISOString(),
      booking: d.booking
        ? {
            id: d.booking.id,
            product_name: d.booking.productName,
            product_image: d.booking.productImage,
            total_price: d.booking.totalPrice,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Disputes API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}