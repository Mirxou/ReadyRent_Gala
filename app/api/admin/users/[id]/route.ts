import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// PATCH /api/admin/users/[id] — Update user (admin/staff only)
// ═══════════════════════════════════════════════════════════════
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const admin = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!admin || (admin.role !== 'admin' && admin.role !== 'staff')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Prevent changing own role
    if (id === session.userId && body.role) {
      return NextResponse.json({ success: false, message_en: 'Cannot change your own role', code: 'SELF_ROLE_CHANGE' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id }, select: { id: true } });
    if (!targetUser) {
      return NextResponse.json({ success: false, message_en: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.role !== undefined && ['customer', 'vendor', 'admin', 'staff'].includes(body.role)) {
      updateData.role = body.role;
    }
    if (body.is_active !== undefined) updateData.isActive = body.is_active;
    if (body.is_verified !== undefined) updateData.isVerified = body.is_verified;
    if (body.first_name !== undefined) updateData.firstName = body.first_name;
    if (body.last_name !== undefined) updateData.lastName = body.last_name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.username !== undefined) updateData.username = body.username;

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        phone: true, role: true, isActive: true, isVerified: true, walletBalance: true,
        createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        first_name: updated.firstName,
        last_name: updated.lastName,
        phone: updated.phone,
        role: updated.role,
        is_active: updated.isActive,
        is_verified: updated.isVerified,
        wallet_balance: updated.walletBalance,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Admin User Update API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error updating user', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}