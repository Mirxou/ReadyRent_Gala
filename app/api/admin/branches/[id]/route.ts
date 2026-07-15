import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// PATCH /api/admin/branches/[id] — Update a branch (admin/staff only)
// DELETE /api/admin/branches/[id] — Delete a branch (admin/staff only)
// ═══════════════════════════════════════════════════════════════

async function requireAdmin(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return { error: authRequiredResponse() };

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return { error: NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 }) };
  }

  return { session };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();

    const branch = await db.branch.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        nameAr: body.name_ar !== undefined ? body.name_ar : undefined,
        code: body.code !== undefined ? body.code : undefined,
        city: body.city !== undefined ? body.city : undefined,
        address: body.address !== undefined ? body.address : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        email: body.email !== undefined ? body.email : undefined,
        latitude: body.latitude !== undefined ? body.latitude : undefined,
        longitude: body.longitude !== undefined ? body.longitude : undefined,
        isActive: body.is_active !== undefined ? body.is_active : undefined,
      },
    });

    const data = {
      id: branch.id,
      name: branch.name,
      name_ar: branch.nameAr || branch.name,
      code: branch.code || '',
      city: branch.city || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      latitude: branch.latitude,
      longitude: branch.longitude,
      is_active: branch.isActive,
      staff_count: 0,
      product_count: 0,
      created_at: branch.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, dignity_preserved: true, data });
  } catch (error) {
    console.error('[Admin Branch API] Update Error:', error);
    return NextResponse.json({ success: false, message_en: 'Failed to update branch' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await db.branch.delete({ where: { id } });
    return NextResponse.json({ success: true, dignity_preserved: true, data: { id } });
  } catch (error) {
    console.error('[Admin Branch API] Delete Error:', error);
    return NextResponse.json({ success: false, message_en: 'Failed to delete branch' }, { status: 500 });
  }
}