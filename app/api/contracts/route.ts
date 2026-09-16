import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

function safeJsonParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /api/contracts — List user's contracts
// P1 fix: added pagination (skip+take+count) — was unbounded findMany
// Optional filters: ?status=draft&limit=20&page=1
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

  // Find contracts through the user's bookings
  const where = {
    OR: [
      { booking: { userId: session.userId } },
      { booking: { product: { vendorId: session.userId } } },
    ],
    ...(status ? { status } : {}),
  };

  const [contracts, total] = await Promise.all([
    db.contract.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true, productName: true, productImage: true,
            startDate: true, endDate: true, totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.contract.count({ where }),
  ]);

  const data = contracts.map((c) => ({
    id: c.id,
    booking_id: c.bookingId,
    status: c.status,
    is_finalized: c.isFinalized,
    contract_hash: c.contractHash,
    terms: c.terms,
    parties: safeJsonParse(c.parties, []),
    renter_signature: c.renterSignature,
    signed_at: c.signedAt?.toISOString() ?? null,
    snapshot: safeJsonParse(c.snapshot, null),
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
    booking: c.booking
      ? {
          id: c.booking.id,
          product_name: c.booking.productName,
          product_image: c.booking.productImage,
          start_date: c.booking.startDate,
          end_date: c.booking.endDate,
          total_price: c.booking.totalPrice,
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
    logger.error('Contracts API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}