import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/products/admin/[id] — Get single product for edit
// PUT /api/products/admin/[id] — Update product
// DELETE /api/products/admin/[id] — Delete product
// ═══════════════════════════════════════════════════════════════
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(_request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'vendor')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, nameAr: true, slug: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, message_en: 'Product not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Vendor can only fetch their own products
    if (user.role === 'vendor' && product.vendorId !== session.userId) {
      return NextResponse.json({ success: false, message_en: 'Not your product', code: 'FORBIDDEN' }, { status: 403 });
    }

    const raw = product as Record<string, unknown>;

    const data = {
      id: product.id,
      name: product.name,
      name_ar: product.nameAr,
      description: product.description,
      daily_rate: (raw.dailyRate ?? raw.pricePerDay ?? null) as number | null,
      primary_image: product.primaryImage,
      images: product.images,
      sizes: (raw.sizes ?? raw.sizeOptions ?? '[]') as string,
      colors: (raw.colors ?? raw.colorOptions ?? '[]') as string,
      is_available: product.isAvailable,
      category: product.category,
      category_id: product.categoryId,
      ...(raw.descriptionAr !== undefined ? { description_ar: raw.descriptionAr as string | null } : {}),
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data });
  } catch (error) {
    console.error('[Admin Product GET API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error fetching product', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'vendor')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message_en: 'Product not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Vendor can only edit their own products
    if (user.role === 'vendor' && existing.vendorId !== session.userId) {
      return NextResponse.json({ success: false, message_en: 'Not your product', code: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.name_ar !== undefined) updateData.nameAr = body.name_ar;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.description_ar !== undefined) updateData.descriptionAr = body.description_ar;
    if (body.daily_rate !== undefined) updateData.dailyRate = body.daily_rate;
    if (body.weekly_rate !== undefined) updateData.weeklyRate = body.weekly_rate;
    if (body.monthly_rate !== undefined) updateData.monthlyRate = body.monthly_rate;
    if (body.primary_image !== undefined) updateData.primaryImage = body.primary_image;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.sizes !== undefined) updateData.sizes = body.sizes;
    if (body.colors !== undefined) updateData.colors = body.colors;
    if (body.is_available !== undefined) updateData.isAvailable = body.is_available;
    if (body.category_id !== undefined) updateData.categoryId = body.category_id;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.slug !== undefined) updateData.slug = body.slug;

    const updated = await db.product.update({ where: { id }, data: updateData });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: { id: updated.id, name: updated.name, name_ar: updated.nameAr },
    });
  } catch (error) {
    console.error('[Admin Product Update API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error updating product', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message_en: 'Product not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ success: true, dignity_preserved: true, message_en: 'Product deleted' });
  } catch (error) {
    console.error('[Admin Product Delete API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error deleting product', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}