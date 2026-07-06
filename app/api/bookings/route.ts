import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/bookings — List user bookings
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const bookings = await db.booking.findMany({
    where: { userId: session.userId },
    include: { product: { select: { id: true, name: true, nameAr: true, primaryImage: true } } },
    orderBy: { createdAt: 'desc' },
  });

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

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}