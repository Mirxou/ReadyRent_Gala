import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET  /api/products/wishlist — List user's wishlist
// POST /api/products/wishlist — Add product to wishlist (upsert)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const items = await db.wishlist.findMany({
    where: { userId: session.userId },
    include: {
      product: {
        select: {
          id: true, name: true, nameAr: true, primaryImage: true,
          pricePerDay: true, isAvailable: true, rating: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = items.map((w) => ({
    id: w.id,
    user_id: w.userId,
    product_id: w.productId,
    created_at: w.createdAt.toISOString(),
    product: w.product
      ? {
          id: w.product.id,
          name: w.product.name,
          name_ar: w.product.nameAr,
          primary_image: w.product.primaryImage,
          price_per_day: w.product.pricePerDay,
          is_available: w.product.isAvailable,
          rating: w.product.rating,
        }
      : null,
  }));

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}

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

  // Upsert to avoid duplicates (unique constraint on [userId, productId])
  const item = await db.wishlist.upsert({
    where: {
      userId_productId: {
        userId: session.userId,
        productId: body.product_id,
      },
    },
    create: {
      userId: session.userId,
      productId: body.product_id,
    },
    update: {}, // no-op if already exists
  });

  const data = {
    id: item.id,
    user_id: item.userId,
    product_id: item.productId,
    created_at: item.createdAt.toISOString(),
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
}