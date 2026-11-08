import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/staff — Staff accounts list (MASTERPLAN 4.1)
// Feeds /admin/staff. "Staff" = any non-customer account
// (admin/staff/vendor/support roles present in this DB).
// Role changes go through PATCH /api/admin/users/[id] (already live).
// ═══════════════════════════════════════════════════════════════

const STAFF_ROLES = ['admin', 'staff', 'vendor', 'manager', 'support', 'delivery'];

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const admin = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    if (!admin || (admin.role !== 'admin' && admin.role !== 'staff')) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const roleParam = searchParams.get('role');
    const where: Record<string, unknown> = { role: { in: STAFF_ROLES } };
    if (roleParam && roleParam !== 'all') {
      if (!STAFF_ROLES.includes(roleParam)) {
        return NextResponse.json(
          {
            success: false,
            dignity_preserved: true,
            message_ar: 'دور غير صالح',
            message_en: 'Invalid role filter',
            code: 'INVALID_ROLE',
          },
          { status: 400 }
        );
      }
      where.role = roleParam;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      results: users.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        is_verified: u.isVerified,
        profile: null,
        created_at: u.createdAt.toISOString(),
      })),
      total: users.length,
    });
  } catch (error) {
    logger.error('Admin Staff API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
