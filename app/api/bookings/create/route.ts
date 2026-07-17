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

  // ── Date validation ──
  if (!body.start_date || !body.end_date) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'start_date and end_date are required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const startDate = new Date(body.start_date);
  const endDate = new Date(body.end_date);
  const now = new Date();

  if (startDate >= endDate) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'start_date must be before end_date', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  if (startDate < now) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'start_date cannot be in the past', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // ── Product validation: must exist and be available ──
  if (!body.product_id) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'product_id is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const product = await db.product.findUnique({
    where: { id: body.product_id },
    select: { name: true, nameAr: true, primaryImage: true, isAvailable: true, pricePerDay: true },
  });

  if (!product) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Product not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  if (!product.isAvailable) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Product is not available for booking', code: 'PRODUCT_UNAVAILABLE' },
      { status: 400 }
    );
  }

  // ── Server-side price calculation (ignore client-supplied total_price) ──
  const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const calculatedTotalPrice = (product.pricePerDay ?? 0) * numberOfDays * (body.quantity ?? 1);

  const productName = body.product_name ?? product.nameAr ?? product.name;
  const productImage = body.product_image ?? product.primaryImage;

  const booking = await db.booking.create({
    data: {
      userId: session.userId,
      productId: body.product_id,
      productName,
      productImage,
      startDate: body.start_date,
      endDate: body.end_date,
      totalPrice: calculatedTotalPrice,
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