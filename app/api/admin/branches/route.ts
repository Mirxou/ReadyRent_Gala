import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/branches — List all branches (admin/staff only)
// POST /api/admin/branches — Create a branch (admin/staff only)
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

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const branches = await db.branch.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const data = branches.map((b) => ({
      id: b.id,
      name: b.name,
      name_ar: b.nameAr || b.name,
      code: b.code || '',
      city: b.city || '',
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      latitude: b.latitude,
      longitude: b.longitude,
      is_active: b.isActive,
      staff_count: 0,
      product_count: 0,
      created_at: b.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, dignity_preserved: true, data, results: data });
  } catch (error) {
    console.error('[Admin Branches API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    const branch = await db.branch.create({
      data: {
        name: body.name || body.name_ar || '',
        nameAr: body.name_ar || null,
        code: body.code || null,
        city: body.city || null,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        isActive: body.is_active !== false,
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

    return NextResponse.json({ success: true, dignity_preserved: true, data }, { status: 201 });
  } catch (error) {
    console.error('[Admin Branches API] Create Error:', error);
    return NextResponse.json({ success: false, message_en: 'Failed to create branch' }, { status: 500 });
  }
}