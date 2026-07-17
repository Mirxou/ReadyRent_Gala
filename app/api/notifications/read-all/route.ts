import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// PATCH /api/notifications/read-all — Mark all notifications as read
// ═══════════════════════════════════════════════════════════════
export async function PATCH(request: NextRequest) {
  try {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  await db.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({
    success: true,
    dignity_preserved: true,
    data: { updated: true },
  });
  } catch (error) {
    console.error('[Notifications Read All] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Error marking all notifications as read', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}