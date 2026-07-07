import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/bookings/cart/items — Add item to cart
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const body = await request.json();

  if (!body.product_id) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'product_id is required',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const item = await db.cartItem.create({
    data: {
      userId: session.userId,
      productId: body.product_id,
      productName: body.product_name ?? null,
      productImage: body.product_image ?? null,
      pricePerDay: body.price_per_day ?? 0,
      startDate: body.start_date ?? null,
      endDate: body.end_date ?? null,
      quantity: body.quantity ?? 1,
      size: body.size ?? null,
      color: body.color ?? null,
    },
  });

  const data = {
    id: item.id,
    user_id: item.userId,
    product_id: item.productId,
    product_name: item.productName,
    product_image: item.productImage,
    price_per_day: item.pricePerDay,
    start_date: item.startDate,
    end_date: item.endDate,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    added_at: item.addedAt.toISOString(),
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
}