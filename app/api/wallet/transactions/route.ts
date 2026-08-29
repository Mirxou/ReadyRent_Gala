import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/wallet/transactions — User transaction history
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const typeFilter = searchParams.get('type');

    const where: Record<string, unknown> = { userId: session.userId };
    if (typeFilter) where.type = typeFilter;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transaction.count({ where }),
    ]);

    const data = transactions.map((t) => ({
      id: t.id,
      type: t.type.toLowerCase(),
      status: 'completed',
      amount: t.amount,
      description: t.note || t.type,
      created_at: t.createdAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
      reference_id: t.referenceId ?? undefined,
    }));

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    logger.error('Wallet Transactions API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}
