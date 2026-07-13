import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Service Booking API — Auth required
// Creates a Booking record for a service
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = getSessionFromRequest(request);
    if (!session) {
      return authRequiredResponse();
    }

    const body = await request.json();
    const { serviceId, date, phone, notes } = body;

    // Validate required fields
    if (!serviceId || !date || !phone) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'يرجى تقديم معرّف الخدمة والتاريخ ورقم الهاتف',
          message_en: 'Service ID, date, and phone are required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Look up the service
    const service = await db.localGuideService.findUnique({
      where: { id: serviceId },
      include: { category: true },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'الخدمة المطلوبة غير موجودة',
          message_en: 'Service not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Create the booking
    const booking = await db.booking.create({
      data: {
        userId: session.userId,
        productName: service.nameAr,
        startDate: date,
        notes: notes || null,
        status: 'pending',
        extraServices: JSON.stringify({ type: 'service', service_id: serviceId, phone }),
      },
    });

    // Create notification for the user
    await db.notification.create({
      data: {
        userId: session.userId,
        type: 'booking',
        title: 'تم استلام طلب حجز الخدمة',
        message: `تم استلام طلب حجز "${service.nameAr}" للتاريخ ${date}. سنتواصل معك قريباً.`,
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: booking.id,
        status: booking.status,
        product_name: booking.productName,
        start_date: booking.startDate,
        message_ar: `تم تأكيد حجز "${service.nameAr}" بنجاح!`,
        message_en: `Booking for "${service.nameAr}" confirmed successfully!`,
      },
    });
  } catch (error) {
    console.error('[Service Booking API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء معالجة الحجز',
        message_en: 'An error occurred while processing the booking',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}