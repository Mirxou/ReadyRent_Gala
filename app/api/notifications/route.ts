import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// GET /api/notifications — List user notifications (newest first)
// ═══════════════════════════════════════════════════════════════
export async function GET(request: Request) {
  try {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const url = new URL(request.url);
  // P2-38 fix: NaN guard + skip+take pagination (was take-only → couldn't fetch past first 200)
  const parsedLimit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50;
  const parsedPage = parseInt(url.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    db.notification.count({ where: { userId: session.userId } }),
  ]);

  const data = notifications.map((n) => ({
    id: n.id,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: n.isRead,
    created_at: n.createdAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    dignity_preserved: true,
    data,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
  } catch (error) {
    logger.error('Notifications GET', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Error fetching notifications', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}