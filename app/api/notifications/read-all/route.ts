import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// PATCH /api/notifications/read-all — Mark all notifications as read
// ═══════════════════════════════════════════════════════════════
export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  await db.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({
    success: true,
    message: 'تم تعليم جميع الإشعارات كمقروءة',
  });
}