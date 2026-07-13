import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Waitlist API — List (auth) + Create (auth)
// ═══════════════════════════════════════════════════════════════════

function errorResponse(messageAr: string, messageEn: string, code: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: messageAr,
      message_en: messageEn,
      code,
    },
    { status }
  );
}

// ──── GET: List user's waitlist items ────
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const items = await db.waitlistItem.findMany({
      where: { userId: session.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
            primaryImage: true,
            pricePerDay: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: items.map((item) => ({
        id: item.id,
        product_id: item.productId,
        product_name: item.productName ?? item.product?.nameAr ?? item.product?.name ?? '',
        product_image: item.productImage ?? item.product?.primaryImage ?? null,
        price_per_day: item.pricePerDay ?? item.product?.pricePerDay ?? 0,
        preferred_start: item.preferredStart ?? null,
        status: item.status,
        created_at: item.createdAt.toISOString(),
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.nameAr || item.product.name,
              slug: item.product.slug,
              primary_image: item.product.primaryImage,
              price_per_day: item.product.pricePerDay,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('[Waitlist API] GET error:', error);
    return errorResponse(
      'حدث خطأ أثناء جلب قائمة الانتظار',
      'An error occurred while fetching waitlist',
      'INTERNAL_ERROR',
      500
    );
  }
}

// ──── POST: Add item to waitlist ────
export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return errorResponse(
        'معرف المنتج مطلوب',
        'Product ID is required',
        'VALIDATION_ERROR',
        400
      );
    }

    // Check product exists
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return errorResponse(
        'المنتج غير موجود',
        'Product not found',
        'NOT_FOUND',
        404
      );
    }

    // Check if already on waitlist
    const existing = await db.waitlistItem.findFirst({
      where: { userId: session.userId, productId },
    });
    if (existing) {
      return errorResponse(
        'المنتج موجود بالفعل في قائمة الانتظار',
        'Product is already on your waitlist',
        'ALREADY_EXISTS',
        409
      );
    }

    // Create waitlist item + notification in transaction
    const item = await db.waitlistItem.create({
      data: {
        userId: session.userId,
        productId,
        productName: product.nameAr || product.name,
        productImage: product.primaryImage,
        pricePerDay: product.pricePerDay,
        status: 'waiting',
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: session.userId,
        type: 'system',
        title: 'تمت إضافتك لقائمة الانتظار',
        message: `تمت إضافة "${product.nameAr || product.name}" إلى قائمة انتظارك. سنعلمك فور توفره.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        dignity_preserved: true,
        data: {
          id: item.id,
          product_id: item.productId,
          product_name: item.productName,
          status: item.status,
          created_at: item.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Waitlist API] POST error:', error);
    return errorResponse(
      'حدث خطأ أثناء الإضافة لقائمة الانتظار',
      'An error occurred while adding to waitlist',
      'INTERNAL_ERROR',
      500
    );
  }
}