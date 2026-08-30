import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { generateContractTerms, computeContractHash } from '@/lib/contract-terms';

// ═══════════════════════════════════════════════════════════════
// POST /api/contracts/generate — Auto-generate contract from booking
// SECURITY: Only booking owner or admin can generate
// ═══════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id || typeof booking_id !== 'string') {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'booking_id is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get booking with product + user info
    const booking = await db.booking.findUnique({
      where: { id: booking_id },
      include: {
        product: {
          select: { id: true, name: true, nameAr: true, vendorId: true, description: true, depositAmount: true },
        },
        user: {
          select: { id: true, username: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'الحجز غير موجود', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // BUG-4: Only allow contract generation for confirmed/active bookings
    if (!['confirmed', 'active'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'لا يمكن إنشاء عقد لحجز غير مؤكد', message_en: 'Contract can only be generated for confirmed or active bookings', code: 'INVALID_BOOKING_STATUS' },
        { status: 400 }
      );
    }

    // Authorization: booking owner or admin
    const currentUser = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';
    if (booking.userId !== session.userId && !isAdmin) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'غير مصرح', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check for existing contract on this booking
    const existing = await db.contract.findUnique({ where: { bookingId: booking_id } });
    if (existing) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'يوجد عقد بالفعل لهذا الحجز', message_en: 'Contract already exists for this booking', code: 'DUPLICATE' },
        { status: 409 }
      );
    }

    // Get vendor info
    const vendor = booking.product?.vendorId
      ? await db.user.findUnique({ where: { id: booking.product.vendorId }, select: { id: true, username: true, firstName: true, lastName: true, email: true } })
      : null;

    const renterName = `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() || booking.user?.username || 'مستأجر';
    const vendorName = vendor ? `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || vendor.username || 'مؤجر' : 'مؤجر';

    // Generate terms
    const terms = generateContractTerms({
      renterName,
      renterEmail: booking.user?.email || '',
      renterPhone: booking.user?.phone || null,
      vendorName,
      vendorEmail: vendor?.email || '',
      productName: booking.product?.nameAr || booking.product?.name || booking.productName || 'منتج',
      productDescription: booking.product?.description || null,
      startDate: booking.startDate?.toISOString().split('T')[0] || '',
      endDate: booking.endDate?.toISOString().split('T')[0] || '',
      totalPrice: booking.totalPrice || 0,
      depositAmount: booking.product?.depositAmount || undefined,
    });

    // Compute SHA-256 hash
    const contractHash = computeContractHash(terms, booking_id);

    // Build parties JSON
    const parties = JSON.stringify([
      { id: booking.userId, name: renterName, role: 'renter', signed: false },
      ...(vendor ? [{ id: vendor.id, name: vendorName, role: 'vendor', signed: false }] : []),
    ]);

    // Build snapshot JSON (consistent with webhook ensureContractForBooking)
    const snapshot = JSON.stringify({
      booking_id,
      product_name: booking.productName,
      product_id: booking.productId,
      total_price: booking.totalPrice,
      deposit_amount: booking.product?.depositAmount ?? null,
      start_date: booking.startDate?.toISOString(),
      end_date: booking.endDate?.toISOString(),
      escrow_status: booking.escrowStatus,
    });

    // Create contract
    const contract = await db.contract.create({
      data: {
        bookingId: booking_id,
        status: 'draft',
        contractHash,
        terms,
        parties,
        snapshot,
      },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId: session.userId,
        type: 'booking',
        title: 'تم إنشاء عقد إيجارك',
        message: 'تم إنشاء عقد رقمي لحجزك. يرجى مراجعة البنود والتوقيع.',
      },
    });

    return NextResponse.json({ success: true, dignity_preserved: true, data: { id: contract.id } }, { status: 201 });
  } catch (error) {
    logger.error('Contract Generate API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
