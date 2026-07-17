import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Vendor Dashboard API — Stats, recent bookings, product overview
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  // Get user's vendor info
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, firstName: true, lastName: true, email: true },
  });

  if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'غير مصرح',
        message_en: 'Unauthorized',
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  // Find the vendor linked to this user
  // NOTE: Vendor model currently has no userId field. The user→vendor link
  // requires a schema migration (add ownerId to Vendor). Until then, vendor-role
  // users see an empty dashboard instead of silently showing the first vendor's data.
  let vendorIds: string[] = [];

  if (user.role === 'admin') {
    // Admin sees everything — get all vendor IDs
    const allVendors = await db.vendor.findMany({ select: { id: true } });
    vendorIds = allVendors.map(v => v.id);
  } else {
    // TODO (schema migration): Add ownerId to Vendor model and query:
    //   const vendor = await db.vendor.findFirst({ where: { ownerId: session.userId } });
    // Until the migration, return empty dashboard for vendor-role users to avoid
    // leaking another vendor's data.
    vendorIds = [];
  }

  // Get vendor's products and their booking stats
  // If no vendor IDs resolved (non-admin without schema link), return empty results
  const vendorProducts = vendorIds.length > 0
    ? await db.product.findMany({
        where: { vendorId: { in: vendorIds } },
        select: {
          id: true,
          name: true,
          nameAr: true,
          pricePerDay: true,
          isAvailable: true,
          rating: true,
          vendorId: true,
          createdAt: true,
        },
      })
    : [];

  const productIds = vendorProducts.map(p => p.id);

  const bookings =
    productIds.length > 0
      ? await db.booking.findMany({
          where: { productId: { in: productIds } },
          select: { id: true, status: true, totalPrice: true, createdAt: true, productName: true },
          orderBy: { createdAt: 'desc' },
        })
      : [];

  const totalRevenue = bookings
    .filter(b => b.status === 'completed' || b.status === 'active')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const activeBookings = bookings.filter(b =>
    ['pending', 'confirmed', 'active'].includes(b.status)
  ).length;

  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  const avgRating =
    vendorProducts.length > 0
      ? vendorProducts.reduce((sum, p) => sum + p.rating, 0) / vendorProducts.length
      : 0;

  return NextResponse.json({
    success: true,
    dignity_preserved: true,
    data: {
      user,
      stats: {
        totalProducts: vendorProducts.length,
        activeProducts: vendorProducts.filter(p => p.isAvailable).length,
        totalBookings: bookings.length,
        activeBookings,
        completedBookings,
        totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
      },
      recentBookings: bookings.slice(0, 5).map(b => ({
        id: b.id,
        status: b.status,
        total_price: b.totalPrice,
        product_name: b.productName,
        created_at: b.createdAt.toISOString(),
      })),
      products: vendorProducts.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        name_ar: p.nameAr,
        price_per_day: p.pricePerDay,
        is_available: p.isAvailable,
        rating: p.rating,
        created_at: p.createdAt.toISOString(),
      })),
    },
  });
}