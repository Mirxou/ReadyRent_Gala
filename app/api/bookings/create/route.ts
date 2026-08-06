import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { createBookingSchema, validateBody } from '@/lib/validators';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// POST /api/bookings/create — Create a new booking
// ═══════════════════════════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();

    // ── Zod validation ──
    const vResult = validateBody(createBookingSchema, body);
    if (!vResult.success) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: vResult.message, message_en: vResult.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { product_id, start_date, end_date, quantity } = vResult.data;
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    const product = await db.product.findUnique({
      where: { id: product_id },
      select: { name: true, nameAr: true, primaryImage: true, isAvailable: true, pricePerDay: true, vendorId: true },
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

    // ── Double-booking check ──
    const conflictingBookings = await db.booking.count({
      where: {
        productId: product_id,
        status: { in: ['pending', 'confirmed', 'active'] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });

    if (conflictingBookings > 0) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Product is already booked for the selected dates', code: 'DATE_CONFLICT' },
        { status: 409 }
      );
    }

    // ── Server-side price calculation (ignore client-supplied total_price) ──
    if (product.pricePerDay == null || product.pricePerDay < 0) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Product has invalid pricing', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedTotalPrice = product.pricePerDay * numberOfDays * quantity;

    const productName = vResult.data.product_name ?? product.nameAr ?? product.name;
    const productImage = vResult.data.product_image ?? product.primaryImage;

    // Fetch renter and vendor info for contract parties
    const [renter, vendor] = await Promise.all([
      db.user.findUnique({
        where: { id: session.userId },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      }),
      product.vendorId
        ? db.vendor.findUnique({
            where: { id: product.vendorId },
            select: { id: true, name: true, nameAr: true, city: true },
          })
        : Promise.resolve(null),
    ]);

    const parties = JSON.stringify([
      {
        role: 'renter',
        name: renter ? `${renter.firstName || ''} ${renter.lastName || ''}`.trim() : 'Unknown',
        email: renter?.email ?? null,
        phone: renter?.phone ?? null,
      },
      {
        role: 'owner',
        name: vendor?.nameAr || vendor?.name || 'STANDARD.Rent',
        city: vendor?.city ?? null,
      },
    ]);

    const booking = await db.booking.create({
      data: {
        userId: session.userId,
        productId: product_id,
        productName,
        productImage,
        startDate: start_date,
        endDate: end_date,
        totalPrice: calculatedTotalPrice,
        status: 'pending',
        escrowStatus: vResult.data.escrow_status ?? 'none',
        hasInsurance: vResult.data.has_insurance ?? false,
        extraServices: vResult.data.extra_services ? JSON.stringify(vResult.data.extra_services) : '[]',
        quantity,
        size: vResult.data.size ?? null,
        color: vResult.data.color ?? null,
        notes: vResult.data.notes ?? null,
      },
    });

    // Auto-create a draft contract for the booking
    await db.contract.create({
      data: {
        bookingId: booking.id,
        status: 'draft',
        parties,
        terms: `عقد إيجار ${productName} — من ${start_date} إلى ${end_date}`,
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
  } catch (error) {
    logger.error('Booking Create API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}