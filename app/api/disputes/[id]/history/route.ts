import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// GET /api/disputes/[id]/history — Get dispute timeline (messages)
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    // Verify dispute exists
    const dispute = await db.dispute.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!dispute) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'النزاع غير موجود',
          message_en: 'Dispute not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Authorization: dispute owner or admin/staff
    const isOwner = dispute.userId === session.userId;
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح بالوصول إلى سجل هذا النزاع',
          message_en: 'Not authorized to access this dispute history',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Fetch all messages ordered by creation time
    const messages = await db.disputeMessage.findMany({
      where: { disputeId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Build timeline: include dispute creation as first entry
    const timeline = [
      {
        id: 'dispute_created',
        type: 'system',
        message: `تم إنشاء النزاع بحالة "${dispute.status}"`,
        created_at: dispute.status, // placeholder, overwritten below
        is_status_change: true,
        status: 'filed',
      },
      ...messages.map((m) => ({
        id: m.id,
        type: m.type,
        message: m.message,
        sender_id: m.senderId,
        created_at: m.createdAt.toISOString(),
        is_status_change: m.type === 'system' && m.message.startsWith('تم تغيير حالة النزاع'),
      })),
    ];

    // Fix first entry timestamp
    const disputeRecord = await db.dispute.findUnique({
      where: { id },
      select: { createdAt: true },
    });
    if (disputeRecord) {
      (timeline[0] as Record<string, unknown>).created_at = disputeRecord.createdAt.toISOString();
    }

    return NextResponse.json({ success: true, dignity_preserved: true, data: timeline });
  } catch (error) {
    console.error('[Dispute History API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء جلب سجل النزاع',
        message_en: 'An error occurred while fetching dispute history',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}