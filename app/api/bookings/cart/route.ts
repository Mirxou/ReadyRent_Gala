import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/bookings/cart — List user's cart items
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const items = await db.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { select: { id: true, name: true, nameAr: true, primaryImage: true, pricePerDay: true, isAvailable: true } } },
    orderBy: { addedAt: 'desc' },
  });

  const data = items.map((item) => ({
    id: item.id,
    user_id: item.userId,
    product_id: item.productId,
    product_name: item.productName ?? item.product?.nameAr ?? item.product?.name ?? null,
    product_image: item.productImage ?? item.product?.primaryImage ?? null,
    price_per_day: item.pricePerDay,
    start_date: item.startDate,
    end_date: item.endDate,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    added_at: item.addedAt.toISOString(),
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          name_ar: item.product.nameAr,
          primary_image: item.product.primaryImage,
          price_per_day: item.product.pricePerDay,
          is_available: item.product.isAvailable,
        }
      : null,
  }));

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}