// ─── POST /api/bookings/[id]/simulate-overdue — DEV DEMO TOOL (⚡) ─────
// Shifts endDate into the past (now - 2 days - 1 hour) so the cron sweep
// picks it up, then runs runLateCheck() immediately: OVERDUE + warning.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { toBookingDTO } from '@/lib/dto';
import { runLateCheck } from '@/lib/late-check';

export const dynamic = 'force-dynamic';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }
  if (booking.status !== 'CONFIRMED') {
    return NextResponse.json(
      {
        error:
          'هذه الأداة التجريبية تعمل فقط على الحجوزات المؤكدة (قيد الاستئجار)',
      },
      { status: 409 },
    );
  }

  const now = new Date();
  const newEndDate = new Date(now.getTime() - TWO_DAYS_MS - ONE_HOUR_MS);
  const durationMs = booking.endDate.getTime() - booking.startDate.getTime();
  let newStartDate = new Date(newEndDate.getTime() - durationMs);
  if (newStartDate.getTime() > now.getTime()) newStartDate = now; // never in the future

  await db.booking.update({
    where: { id },
    data: { startDate: newStartDate, endDate: newEndDate },
  });

  // Run the sweep right away → status OVERDUE + LATE_WARNING email (once).
  await runLateCheck(now);

  const updated = await db.booking.findUnique({
    where: { id },
    include: {
      item: { include: { merchant: true } },
      customer: true,
      review: { include: { customer: true } },
    },
  });
  if (!updated) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }

  return NextResponse.json({ booking: toBookingDTO(updated, now) });
}
