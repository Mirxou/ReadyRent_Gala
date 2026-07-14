import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/bookings — List all bookings (admin/staff only)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, firstName: true, lastName: true, email: true, role: true } },
          product: { select: { id: true, name: true, nameAr: true, primaryImage: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.booking.count({ where }),
    ]);

    const data = bookings.map(b => ({
      id: b.id,
      user_id: b.userId,
      product_id: b.productId,
      product_name: b.productName ?? b.product?.nameAr ?? b.product?.name,
      product_image: b.productImage ?? b.product?.primaryImage,
      start_date: b.startDate,
      end_date: b.endDate,
      total_price: b.totalPrice,
      status: b.status,
      escrow_status: b.escrowStatus,
      has_insurance: b.hasInsurance,
      quantity: b.quantity,
      user: b.user ? { id: b.user.id, username: b.user.username, first_name: b.user.firstName, last_name: b.user.lastName, email: b.user.email, role: b.user.role } : null,
      created_at: b.createdAt.toISOString(),
      updated_at: b.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Admin Bookings API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error fetching bookings', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}