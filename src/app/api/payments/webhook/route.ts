// ─── POST /api/payments/webhook — simulated gateway callback ──────────
// Escrow: CONFIRMED + depositHeld, then 2 notifications (P2):
//   a) PAYMENT_RECEIPT → customer   b) MERCHANT_NEW_ORDER → merchant

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { toBookingDTO, zodMessage } from '@/lib/dto';
import { formatDZD } from '@/lib/escrow';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const webhookSchema = z.object({
  bookingId: z.string().min(1),
  providerRef: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `بيانات غير صالحة: ${zodMessage(parsed.error.issues)}` },
      { status: 400 },
    );
  }
  const { bookingId, providerRef } = parsed.data;

  const existing = await db.booking.findUnique({
    where: { id: bookingId },
    include: { item: { include: { merchant: true } }, customer: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }

  const now = new Date();
  // Conditional update = atomic-ish guard against double payment:
  // only succeeds when the booking is still PENDING_PAYMENT.
  const paid = await db.booking.updateMany({
    where: { id: bookingId, status: 'PENDING_PAYMENT' },
    data: {
      status: 'CONFIRMED',
      depositHeld: existing.deposit,
      paidAt: now,
      paymentRef: providerRef ?? `WH-${Date.now()}`,
    },
  });
  if (paid.count === 0) {
    return NextResponse.json(
      { error: 'الحجز مدفوع أو ملغى مسبقاً' },
      { status: 409 },
    );
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { item: { include: { merchant: true } }, customer: true },
  });
  if (!booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }

  const start = booking.startDate.toLocaleDateString('ar-DZ');
  const end = booking.endDate.toLocaleDateString('ar-DZ');

  // a) Payment receipt → customer
  await sendEmail({
    toEmail: booking.customer.email,
    toName: booking.customer.name,
    subject: `🧾 إيصال الدفع — حجز «${booking.item.name}»`,
    body: [
      `مرحباً ${booking.customer.name}،`,
      '',
      'تم تأكيد دفع حجزك بنجاح، هذا إيصالك:',
      `• المعدة: ${booking.item.name} (${booking.item.category})`,
      `• المدة: ${booking.days} يوم — من ${start} إلى ${end}`,
      `• رقم الحجز: ${booking.id}`,
      '',
      'تفصيل المبالغ:',
      `• أجرة الكراء: ${formatDZD(booking.rentalPrice)}`,
      `• الضمان المحتجز (قابل للاسترداد): ${formatDZD(booking.deposit)}`,
      `• التأمين: ${formatDZD(booking.insuranceFee)}`,
      `• الإجمالي المدفوع: ${formatDZD(booking.totalPrice)}`,
      '',
      'ملاحظة: سيُفرج عن الضمان بعد تأكيد التاجر للاستلام.',
      `مرجع العملية: ${booking.paymentRef}`,
      '',
      '— منصة كراء بلا همّ',
    ].join('\n'),
    type: 'PAYMENT_RECEIPT',
    bookingId: booking.id,
  });

  // b) New order alert → merchant
  await sendEmail({
    toEmail: booking.item.merchant.email,
    toName: booking.item.merchant.name,
    subject: `🔔 طلب جديد: «${booking.item.name}» من ${booking.customer.name}`,
    body: [
      `مرحباً ${booking.item.merchant.name}،`,
      '',
      'وصلك طلب كراء جديد عبر المنصة:',
      `• المعدة: ${booking.item.name}`,
      `• المستأجر: ${booking.customer.name}`,
      `• المدة: ${booking.days} يوم — من ${start} إلى ${end}`,
      `• أجرة الكراء: ${formatDZD(booking.rentalPrice)}`,
      '',
      'يرجى تجهيز المعدة في الموعد المتفق عليه، وسنخبرك فور انتهاء مدة الكراء لتأكيد الاستلام.',
      '',
      '— منصة كراء بلا همّ',
    ].join('\n'),
    type: 'MERCHANT_NEW_ORDER',
    bookingId: booking.id,
  });

  return NextResponse.json({ booking: toBookingDTO(booking, now) });
}
