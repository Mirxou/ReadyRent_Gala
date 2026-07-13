import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/bookings/[id] — Get a single booking with full details
// PATCH /api/bookings/[id] — Update a booking
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, name: true, nameAr: true, primaryImage: true, slug: true, vendorId: true },
        },
        user: {
          select: { id: true, email: true, username: true, firstName: true, lastName: true, phone: true, role: true },
        },
        reviews: {
          select: { id: true, rating: true, comment: true, status: true, createdAt: true },
        },
        contracts: {
          select: { id: true, status: true, contractHash: true, signedAt: true, createdAt: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الحجز غير موجود',
          message_en: 'Booking not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Authorization: must be booking owner OR admin/staff
    const isOwner = booking.userId === session.userId;
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = user?.role === 'admin' || user?.role === 'staff';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح بالوصول إلى هذا الحجز',
          message_en: 'Not authorized to access this booking',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Get related cart items (by product + user, matching the booking)
    const cartItems = booking.productId && booking.userId
      ? await db.cartItem.findMany({
          where: {
            userId: booking.userId,
            productId: booking.productId,
          },
          orderBy: { addedAt: 'desc' },
        })
      : [];

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
            slug: booking.product.slug,
            vendor_id: booking.product.vendorId,
          }
        : null,
      user: booking.user
        ? {
            id: booking.user.id,
            email: booking.user.email,
            username: booking.user.username,
            first_name: booking.user.firstName,
            last_name: booking.user.lastName,
            phone: booking.user.phone,
            role: booking.user.role,
          }
        : null,
      items: cartItems.map((item) => ({
        id: item.id,
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
      })),
      reviews: booking.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        created_at: r.createdAt.toISOString(),
      })),
      contracts: booking.contracts.map((c) => ({
        id: c.id,
        status: c.status,
        contract_hash: c.contractHash,
        signed_at: c.signedAt?.toISOString() ?? null,
        created_at: c.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data });
  } catch (error) {
    console.error('[Booking Detail API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب بيانات الحجز',
        message_en: 'An error occurred while fetching booking details',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
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
  } catch (error) {
    console.error('[Booking Update API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء تحديث الحجز',
        message_en: 'An error occurred while updating the booking',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}