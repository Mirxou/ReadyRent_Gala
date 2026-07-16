import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/products/admin — List products for admin management
// POST /api/products/admin — Create a new product (admin/vendor)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'vendor')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category_id') || '';

    const where: Record<string, unknown> = {};
    if (user.role === 'vendor') {
      where.vendorId = session.userId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, nameAr: true } },
          vendor: { select: { id: true, username: true, firstName: true, lastName: true } },
          _count: { select: { bookings: true, reviews: true, wishlists: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    const data = products.map(p => ({
      id: p.id,
      name: p.name,
      name_ar: p.nameAr,
      description: p.description,
      daily_rate: p.pricePerDay,
      primary_image: p.primaryImage,
      images: p.images,
      sizes: p.sizeOptions,
      colors: p.colorOptions,
      is_available: p.isAvailable,
      category: p.category,
      vendor: p.vendor,
      booking_count: p._count.bookings,
      review_count: p._count.reviews,
      wishlist_count: p._count.wishlists,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Admin Products API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error fetching products', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'vendor')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (!body.name && !body.name_ar) {
      return NextResponse.json({ success: false, message_en: 'Product name is required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    if (!body.daily_rate || body.daily_rate <= 0) {
      return NextResponse.json({ success: false, message_en: 'Valid daily_rate is required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Validate category exists
    if (body.category_id) {
      const cat = await db.category.findUnique({ where: { id: body.category_id } });
      if (!cat) {
        return NextResponse.json({ success: false, message_en: 'Category not found', code: 'NOT_FOUND' }, { status: 400 });
      }
    }

    const slug = body.slug || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`;

    const product = await db.product.create({
      data: {
        name: body.name || body.name_ar,
        nameAr: body.name_ar || body.name,
        description: body.description_ar || body.description || '',
        pricePerDay: body.daily_rate,
        primaryImage: body.primary_image || null,
        images: typeof body.images === 'string' ? body.images : JSON.stringify(body.images || []),
        sizeOptions: typeof body.sizes === 'string' ? body.sizes : JSON.stringify(body.sizes || []),
        colorOptions: typeof body.colors === 'string' ? body.colors : JSON.stringify(body.colors || []),
        isAvailable: body.is_available !== false,
        slug,
        categoryId: body.category_id || null,
        vendorId: user.role === 'vendor' ? session.userId : (body.vendor_id || null),
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: { id: product.id, name: product.name, name_ar: product.nameAr, slug: product.slug },
    }, { status: 201 });
  } catch (error) {
    console.error('[Admin Product Create API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error creating product', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}