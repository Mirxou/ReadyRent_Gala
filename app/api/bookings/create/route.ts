import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/bookings/create — Create a new booking
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const body = await request.json();

  // Look up product for name/image if product_id provided
  let productName = body.product_name ?? null;
  let productImage = body.product_image ?? null;

  if (body.product_id) {
    const product = await db.product.findUnique({
      where: { id: body.product_id },
      select: { name: true, nameAr: true, primaryImage: true },
    });
    if (product) {
      productName = productName ?? product.nameAr ?? product.name;
      productImage = productImage ?? product.primaryImage;
    }
  }

  const booking = await db.booking.create({
    data: {
      userId: session.userId,
      productId: body.product_id ?? null,
      productName,
      productImage,
      startDate: body.start_date ?? null,
      endDate: body.end_date ?? null,
      totalPrice: body.total_price ?? 0,
      status: 'pending',
      escrowStatus: body.escrow_status ?? 'none',
      hasInsurance: body.has_insurance ?? false,
      extraServices: body.extra_services ? JSON.stringify(body.extra_services) : '[]',
      quantity: body.quantity ?? 1,
      size: body.size ?? null,
      color: body.color ?? null,
      notes: body.notes ?? null,
    },
  });

  const data = {
    id: booking.id,
    user_id: booking.userId,
    product_id: booking.productId,
    product_name: booking.productName,
    product_image: booking.productImage,
    start_date: booking.startDate,
    end_date: booking.endDate,
    total_price: booking.totalPrice,
    status: booking.status,
    escrow_status: booking.escrowStatus,
    has_insurance: booking.hasInsurance,
    extra_services: JSON.parse(booking.extraServices),
    quantity: booking.quantity,
    size: booking.size,
    color: booking.color,
    notes: booking.notes,
    created_at: booking.createdAt.toISOString(),
    updated_at: booking.updatedAt.toISOString(),
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
}