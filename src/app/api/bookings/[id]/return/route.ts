// ─── POST /api/bookings/[id]/return — merchant confirms item return ───
// Recomputes accrued late fee, completes the booking, releases escrow
// balance to the customer and sends the ESCROW_RELEASE email.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { toBookingDTO } from '@/lib/dto';
import { computeAccruedLateFee, formatDZD } from '@/lib/escrow';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: { item: { include: { merchant: true } }, customer: true },
  });
  if (!booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }
  if (booking.status !== 'CONFIRMED' && booking.status !== 'OVERDUE') {
    return NextResponse.json(
      { error: 'لا يمكن تأكيد الإرجاع إلا للحجوزات المؤكدة أو المتأخرة' },
      { status: 409 },
    );
  }

  const now = new Date();
  const lateFee = computeAccruedLateFee({
    endDate: booking.endDate,
    lateFeePerDay: booking.lateFeePerDay,
    deposit: booking.deposit,
    now,
  });
  const depositReturned = Math.max(0, booking.deposit - lateFee); // never negative

  const updated = await db.booking.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      returnedAt: now,
      lateFee,
      depositReturned,
    },
    include: { item: { include: { merchant: true } }, customer: true },
  });

  await sendEmail({
    toEmail: updated.customer.email,
    toName: updated.customer.name,
    subject: `🎉 تم فك الحجز عن ضمانك — «${updated.item.name}»`,
    body: [
      `مرحباً ${updated.customer.name}،`,
      '',
      `تأكدنا من استلام التاجر للمعدة «${updated.item.name}»، وتم إقفال الحجز بنجاح.`,
      '',
      'تفصيل الضمان:',
      `• الضمان المحتجز: ${formatDZD(updated.deposit)}`,
      `• رسوم التأخير المقتطعة: ${
        updated.lateFee > 0
          ? formatDZD(updated.lateFee)
          : 'لا شيء — أرجعتَ المعدة في موعدها 👌'
      }`,
      `• الصافي المُعاد إليك: ${formatDZD(updated.depositReturned)}`,
      '',
      'شكراً لثقتك بمنصة كراء بلا همّ، نتشرف بخدمتك مرة أخرى.',
      '',
      '— منصة كراء بلا همّ',
    ].join('\n'),
    type: 'ESCROW_RELEASE',
    bookingId: updated.id,
  });

  return NextResponse.json({ booking: toBookingDTO(updated, now) });
}
