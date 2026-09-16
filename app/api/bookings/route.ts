import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/bookings — List user bookings
// P1 fix: added pagination (skip+take+count) — was unbounded findMany
// Optional filters: ?status=confirmed&limit=20&page=1
// ═══════════════════════════════════════════════════════════════

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;

    // P1 fix: parse + sanitize pagination params (was missing entirely)
    let page = parseInt(url.searchParams.get('page') || '1', 10);
    let limit = parseInt(url.searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_PAGE_SIZE;
    if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
    const skip = (page - 1) * limit;

    const where = { userId: session.userId, ...(status ? { status } : {}) };

    // P1 fix: parallel fetch of rows + total count for client pagination
    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: { product: { select: { id: true, name: true, nameAr: true, primaryImage: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.booking.count({ where }),
    ]);

    const data = bookings.map((b) => ({
      id: b.id,
      user_id: b.userId,
      product_id: b.productId,
      product_name: b.productName ?? b.product?.nameAr ?? b.product?.name ?? null,
      product_image: b.productImage ?? b.product?.primaryImage ?? null,
      start_date: b.startDate,
      end_date: b.endDate,
      total_price: b.totalPrice,
      status: b.status,
      escrow_status: b.escrowStatus,
      has_insurance: b.hasInsurance,
      extra_services: b.extraServices ? JSON.parse(b.extraServices) : [],
      quantity: b.quantity,
      size: b.size,
      color: b.color,
      notes: b.notes,
      created_at: b.createdAt.toISOString(),
      updated_at: b.updatedAt.toISOString(),
      product: b.product
        ? {
            id: b.product.id,
            name: b.product.name,
            name_ar: b.product.nameAr,
            primary_image: b.product.primaryImage,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
      // P1 fix: pagination metadata so clients can render page controls
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Bookings API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}
