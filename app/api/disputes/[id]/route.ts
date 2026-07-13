import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/disputes/[id] — Get a single dispute with full details
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, username: true, firstName: true, lastName: true, role: true },
        },
        booking: {
          include: {
            product: {
              select: { id: true, name: true, nameAr: true, primaryImage: true, vendorId: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            dispute: { select: { id: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'النزاع غير موجود',
          message_en: 'Dispute not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Authorization: dispute owner, booking vendor, or admin/staff
    const isOwner = dispute.userId === session.userId;
    const isVendor = dispute.booking?.product?.vendorId
      ? await db.vendor.findUnique({
          where: { id: dispute.booking.product.vendorId },
        }).then(() => false) // vendors aren't directly linked to users in this schema
      : false;
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح بالوصول إلى هذا النزاع',
          message_en: 'Not authorized to access this dispute',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Calculate approval/rejection counts from messages (system messages with decisions)
    const approvalCount = dispute.messages.filter(
      (m) => m.type === 'system' && m.message.includes('approved')
    ).length;
    const rejectionCount = dispute.messages.filter(
      (m) => m.type === 'system' && m.message.includes('rejected')
    ).length;

    const data = {
      id: dispute.id,
      user_id: dispute.userId,
      booking_id: dispute.bookingId,
      title: dispute.title,
      description: dispute.description,
      claim_type: dispute.claimType,
      status: dispute.status,
      priority: dispute.priority,
      claimed_amount: dispute.claimedAmount,
      evidence_urls: dispute.evidenceUrls ? JSON.parse(dispute.evidenceUrls) : [],
      created_at: dispute.createdAt.toISOString(),
      updated_at: dispute.updatedAt.toISOString(),
      user: dispute.user
        ? {
            id: dispute.user.id,
            email: dispute.user.email,
            username: dispute.user.username,
            first_name: dispute.user.firstName,
            last_name: dispute.user.lastName,
            role: dispute.user.role,
          }
        : null,
      booking: dispute.booking
        ? {
            id: dispute.booking.id,
            product_name: dispute.booking.productName,
            product_image: dispute.booking.productImage,
            total_price: dispute.booking.totalPrice,
            status: dispute.booking.status,
            product: dispute.booking.product
              ? {
                  id: dispute.booking.product.id,
                  name: dispute.booking.product.name,
                  name_ar: dispute.booking.product.nameAr,
                  primary_image: dispute.booking.product.primaryImage,
                  vendor_id: dispute.booking.product.vendorId,
                }
              : null,
          }
        : null,
      messages: dispute.messages.map((m) => ({
        id: m.id,
        dispute_id: m.disputeId,
        sender_id: m.senderId,
        type: m.type,
        message: m.message,
        created_at: m.createdAt.toISOString(),
      })),
      approval_count: approvalCount,
      rejection_count: rejectionCount,
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data });
  } catch (error) {
    console.error('[Dispute Detail API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب بيانات النزاع',
        message_en: 'An error occurred while fetching dispute details',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}