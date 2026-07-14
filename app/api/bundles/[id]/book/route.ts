import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// POST /api/bundles/[id]/book — Book an entire bundle
// Creates a Booking per item + single Transaction for total
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const body = await request.json();
  const { startDate, endDate, notes } = body;

  // Fetch bundle with items and product details
  const bundle = await db.bundle.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!bundle) {
    return NextResponse.json(
      { success: false, message: 'الباقة غير موجودة' },
      { status: 404 }
    );
  }

  if (!bundle.items.length) {
    return NextResponse.json(
      { success: false, message: 'الباقة فارغة' },
      { status: 400 }
    );
  }

  // Calculate rental days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  // Calculate subtotal, discount, and total
  const subtotal = bundle.items.reduce(
    (sum, item) => sum + item.product.pricePerDay * days,
    0
  );
  const discount = Math.floor(subtotal * (bundle.discountPercentage / 100));
  const total = subtotal - discount;

  // Create a Booking record for each item in the bundle
  const bookings = await Promise.all(
    bundle.items.map(async (item) => {
      return db.booking.create({
        data: {
          userId: session.userId,
          productId: item.productId,
          productName: item.product.nameAr || item.product.name,
          productImage: item.product.primaryImage,
          startDate,
          endDate,
          totalPrice: Math.floor(item.product.pricePerDay * days * (1 - bundle.discountPercentage / 100)),
          status: 'pending',
          notes: notes
            ? `باقة: ${bundle.nameAr || bundle.name}. ${notes}`
            : `باقة: ${bundle.nameAr || bundle.name}`,
        },
      });
    })
  );

  // Create a single Transaction for the bundle total
  await db.transaction.create({
    data: {
      userId: session.userId,
      type: 'ESCROW_HELD',
      amount: total,
      note: `حجز باقة: ${bundle.nameAr || bundle.name} (${bundle.items.length} منتجات)`,
    },
  });

  // Notify the user
  await db.notification.create({
    data: {
      userId: session.userId,
      type: 'booking',
      title: 'تم إنشاء حجز الباقة',
      message: `تم حجز باقة "${bundle.nameAr || bundle.name}" بنجاح (${bundle.items.length} منتجات) - المبلغ: ${total} دج`,
    },
  });

  return NextResponse.json({
    success: true,
    data: { bookings, total, discount, days },
  });
}