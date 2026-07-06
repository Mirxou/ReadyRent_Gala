import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/bookings/[id] — Get a single booking
// PATCH /api/bookings/[id] — Update a booking
// ═══════════════════════════════════════════════════════════════
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: { product: { select: { id: true, name: true, nameAr: true, primaryImage: true } } },
  });

  if (!booking || booking.userId !== session.userId) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Booking not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  const data = {
    id: booking.id,
    user_id: booking.userId,
    product_id: booking.productId,
    product_name: booking.productName ?? booking.product?.nameAr ?? booking.product?.name ?? null,
    product_image: booking.productImage ?? booking.product?.primaryImage ?? null,
    start_date: booking.startDate,
    end_date: booking.endDate,
    total_price: booking.totalPrice,
    status: booking.status,
    escrow_status: booking.escrowStatus,
    has_insurance: booking.hasInsurance,
    extra_services: booking.extraServices ? JSON.parse(booking.extraServices) : [],
    quantity: booking.quantity,
    size: booking.size,
    color: booking.color,
    notes: booking.notes,
    created_at: booking.createdAt.toISOString(),
    updated_at: booking.updatedAt.toISOString(),
    product: booking.product
      ? {
          id: booking.product.id,
          name: booking.product.name,
          name_ar: booking.product.nameAr,
          primary_image: booking.product.primaryImage,
        }
      : null,
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const { id } = await params;
  const existing = await db.booking.findUnique({ where: { id } });

  if (!existing || existing.userId !== session.userId) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Booking not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.escrow_status !== undefined) updateData.escrowStatus = body.escrow_status;
  if (body.has_insurance !== undefined) updateData.hasInsurance = body.has_insurance;
  if (body.extra_services !== undefined) updateData.extraServices = JSON.stringify(body.extra_services);
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.size !== undefined) updateData.size = body.size;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.start_date !== undefined) updateData.startDate = body.start_date;
  if (body.end_date !== undefined) updateData.endDate = body.end_date;
  if (body.total_price !== undefined) updateData.totalPrice = body.total_price;
  if (body.product_name !== undefined) updateData.productName = body.product_name;
  if (body.product_image !== undefined) updateData.productImage = body.product_image;

  const booking = await db.booking.update({
    where: { id },
    data: updateData,
    include: { product: { select: { id: true, name: true, nameAr: true, primaryImage: true } } },
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

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}