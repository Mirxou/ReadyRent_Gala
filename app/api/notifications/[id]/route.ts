import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// PATCH /api/notifications/[id] — Mark as read
// DELETE /api/notifications/[id] — Delete notification
// ═══════════════════════════════════════════════════════════════
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const { id } = await params;
  const notification = await db.notification.findUnique({ where: { id } });

  if (!notification || notification.userId !== session.userId) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Notification not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  const updated = await db.notification.update({
    where: { id },
    data: { isRead: true },
  });

  const data = {
    id: updated.id,
    user_id: updated.userId,
    type: updated.type,
    title: updated.title,
    message: updated.message,
    is_read: updated.isRead,
    created_at: updated.createdAt.toISOString(),
  };

  return NextResponse.json({ success: true, dignity_preserved: true, data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const { id } = await params;
  const notification = await db.notification.findUnique({ where: { id } });

  if (!notification || notification.userId !== session.userId) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Notification not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  await db.notification.delete({ where: { id } });

  return NextResponse.json({
    success: true,
    dignity_preserved: true,
    data: { id },
  });
}