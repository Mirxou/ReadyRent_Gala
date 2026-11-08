import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/activity-logs — Audit trail (MASTERPLAN 4.1)
// Feeds /admin/activity-logs. The ActivityLog model stores
// userId/action/target/ip/createdAt; model_name is derived from
// target (format "Model:object" or a free tag).
// ═══════════════════════════════════════════════════════════════

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
    const parsedLimit = parseInt(searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(200, parsedLimit) : 100;
    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const skip = (page - 1) * limit;

    const actionFilter = searchParams.get('action');
    const modelFilter = searchParams.get('model_name');

    const where: Record<string, unknown> = {};
    if (actionFilter && actionFilter !== 'all') where.action = actionFilter;
    if (modelFilter && modelFilter !== 'all') where.target = modelFilter;

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      results: logs.map((log) => {
        const modelName = log.target ? log.target.split(':')[0] : 'system';
        return {
          id: log.id,
          user: log.user?.id ?? null,
          user_email: log.user?.email ?? 'نظام',
          user_name: log.user?.username ?? null,
          action: log.action,
          model_name: modelName,
          object_id: null,
          description: log.target ? `${log.action} — ${log.target}` : log.action,
          ip_address: log.ip ?? '',
          user_agent: '',
          created_at: log.createdAt.toISOString(),
        };
      }),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Admin Activity Logs API', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
