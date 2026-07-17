import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════════
// Analytics Events — Track & retrieve (in-memory for now)
// ═══════════════════════════════════════════════════════════════════

interface AnalyticsEvent {
  id: string;
  event_type: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// In-memory event store (logs to console as well)
const eventsStore: AnalyticsEvent[] = [];
const MAX_EVENTS = 500;

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const body = await request.json();
    const { event_type, target_id, metadata } = body;

    if (!event_type || typeof event_type !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'نوع الحدث مطلوب',
          message_en: 'Event type is required',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    const event: AnalyticsEvent = {
      id: generateId(),
      event_type,
      target_id: target_id ?? undefined,
      metadata: metadata ?? undefined,
      created_at: new Date().toISOString(),
    };

    // Store in memory (cap at MAX_EVENTS)
    eventsStore.push(event);
    if (eventsStore.length > MAX_EVENTS) {
      eventsStore.splice(0, eventsStore.length - MAX_EVENTS);
    }

    // Log for monitoring
    console.log(`[Analytics Event] ${event.event_type}`, target_id ?? '', metadata ?? '');

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: event.id,
        created_at: event.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في تسجيل الحدث',
        message_en: 'Error tracking event',
        code: 'EVENT_ERROR',
      },
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

    let events = [...eventsStore].reverse(); // Most recent first

    if (eventType) {
      events = events.filter((e) => e.event_type === eventType);
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        events: events.slice(0, limit),
        total: eventsStore.length,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'خطأ في جلب الأحداث',
        message_en: 'Error fetching events',
        code: 'EVENTS_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}