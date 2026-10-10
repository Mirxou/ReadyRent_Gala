import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { PAYOUT_METHOD_LABELS } from '@/lib/payouts';

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/payout-requests — admin processing queue
// GRAFT PHASE 3: every merchant withdrawal demand, freshest first.
// Admin/staff only — this queue is the human leg of the 360° money path.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return NextResponse.json(
      { success: false, message_en: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [requests, total, pendingAgg] = await Promise.all([
      db.payoutRequest.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, nameAr: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payoutRequest.count({ where }),
      db.payoutRequest.aggregate({
        _count: { _all: true },
        _sum: { amount: true },
        where: { status: 'pending' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        requests: requests.map(r => ({
          id: r.id,
          amount: r.amount,
          method: r.method,
          method_label: PAYOUT_METHOD_LABELS[r.method as keyof typeof PAYOUT_METHOD_LABELS] ?? r.method,
          account_name: r.accountName,
          account_number: r.accountNumber,
          status: r.status,
          admin_note: r.adminNote,
          transfer_ref: r.transferRef,
          processed_by: r.processedBy,
          processed_at: r.processedAt?.toISOString() ?? null,
          created_at: r.createdAt.toISOString(),
          vendor: r.vendor
            ? { id: r.vendor.id, name: r.vendor.name, name_ar: r.vendor.nameAr }
            : null,
          user: r.user
            ? { id: r.user.id, email: r.user.email, first_name: r.user.firstName, last_name: r.user.lastName }
            : null,
        })),
        pending_count: pendingAgg._count._all,
        pending_amount: pendingAgg._sum.amount ?? 0,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Admin payout-requests list failed:', error);
    return NextResponse.json(
      { success: false, message_en: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
