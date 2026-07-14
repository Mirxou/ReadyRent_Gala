import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/users — List all users (admin/staff only)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return NextResponse.json({ success: false, message_en: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, email: true, username: true, firstName: true, lastName: true,
          phone: true, role: true, isActive: true, isVerified: true, is2FaEnabled: true,
          walletBalance: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const data = users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      first_name: u.firstName,
      last_name: u.lastName,
      phone: u.phone,
      role: u.role,
      is_active: u.isActive,
      is_verified: u.isVerified,
      two_fa_enabled: u.is2FaEnabled,
      wallet_balance: u.walletBalance,
      created_at: u.createdAt.toISOString(),
      updated_at: u.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    return NextResponse.json({ success: false, message_en: 'Error fetching users', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}