import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/bookings/cart/items — Add item to cart
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
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

  // Validate product exists and get real price
  const product = await db.product.findUnique({
    where: { id: body.product_id },
    select: { id: true, name: true, nameAr: true, primaryImage: true, pricePerDay: true, isAvailable: true },
  });

  if (!product) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Product not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  if (!product.isAvailable) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Product is not available',
        code: 'PRODUCT_UNAVAILABLE',
      },
      { status: 400 }
    );
  }

  // Check for duplicate cart item
  const existingItem = await db.cartItem.findFirst({
    where: { userId: session.userId, productId: body.product_id },
  });

  if (existingItem) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Product is already in your cart',
        code: 'ALREADY_IN_CART',
      },
      { status: 409 }
    );
  }

  // Use server-side price (ignore client-supplied price_per_day)
  const quantity = body.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'quantity must be a positive integer',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const item = await db.cartItem.create({
    data: {
      userId: session.userId,
      productId: product.id,
      productName: body.product_name ?? product.nameAr ?? product.name ?? null,
      productImage: body.product_image ?? product.primaryImage ?? null,
      pricePerDay: product.pricePerDay ?? 0,
      startDate: body.start_date ?? null,
      endDate: body.end_date ?? null,
      quantity,
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
  } catch (error) {
    console.error('[Cart Items API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}