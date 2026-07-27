import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// Analytics Events - Track & retrieve events from ActivityLog table

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const body = await request.json();
    const { event_type, target_id, metadata } = body;

    if (!event_type || typeof event_type !== 'string') {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'نوع الحدث مطلوب', message_en: 'Event type is required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const event = await db.activityLog.create({
      data: { userId: session.userId, action: event_type, target: target_id ?? null },
    });

    console.log(`[Analytics Event] ${event_type}`, target_id ?? '', metadata ?? '');

    return NextResponse.json({ success: true, dignity_preserved: true, data: { id: event.id, created_at: event.createdAt.toISOString() } });
  } catch {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'خطأ في تسجيل الحدث', message_en: 'Error tracking event', code: 'EVENT_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 200);
    const eventType = searchParams.get('event_type');

    const where: Record<string, unknown> = { userId: session.userId };
    if (eventType) { where.action = eventType; }

    const [events, total] = await Promise.all([
      db.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
      db.activityLog.count({ where: { userId: session.userId } }),
    ]);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        events: events.map((e) => ({ id: e.id, event_type: e.action, target_id: e.target, created_at: e.createdAt.toISOString() })),
        total,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'خطأ في جلب الأحداث', message_en: 'Error fetching events', code: 'EVENTS_FETCH_ERROR' },
      { status: 500 }
    );
  }
}
