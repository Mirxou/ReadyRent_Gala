// ─── Late-return sweep (cron logic) ──────────────────────────────────
// 1. CONFIRMED bookings whose endDate has passed → OVERDUE + LATE_WARNING email (once).
// 2. Already-OVERDUE bookings keep accruing the daily late fee (capped at deposit).

import { db } from '@/lib/db';
import { computeAccruedLateFee, formatDZD } from '@/lib/escrow';
import { sendEmail } from '@/lib/email';
import type { LateCheckResponse } from '@/lib/types';

export async function runLateCheck(now: Date = new Date()): Promise<LateCheckResponse> {
  const active = await db.booking.findMany({
    where: { status: { in: ['CONFIRMED', 'OVERDUE'] }, endDate: { lt: now } },
    include: { item: true, customer: true },
  });

  let newlyOverdue = 0;
  let warningsSent = 0;
  let totalLateFees = 0;

  for (const booking of active) {
    const lateFee = computeAccruedLateFee({
      endDate: booking.endDate,
      lateFeePerDay: booking.lateFeePerDay,
      deposit: booking.deposit,
      now,
    });
    totalLateFees += lateFee;

    if (booking.status === 'CONFIRMED') {
      newlyOverdue += 1;
      await db.booking.update({
        where: { id: booking.id },
        data: { status: 'OVERDUE', lateFee },
      });

      if (!booking.lateWarningSent) {
        const daysLate = Math.max(
          1,
          Math.ceil((now.getTime() - booking.endDate.getTime()) / (24 * 60 * 60 * 1000)),
        );
        await sendEmail({
          toEmail: booking.customer.email,
          toName: booking.customer.name,
          subject: `⏰ إنذار تأخير: بدء احتساب رسوم التأخير على حجز «${booking.item.name}»`,
          body: [
            `مرحباً ${booking.customer.name}،`,
            '',
            `تجاوزتَ موعد إرجاع «${booking.item.name}» المتفق عليه (${booking.endDate.toLocaleDateString('ar-DZ')}) بمقدار ${daysLate} يوم.`,
            '',
            `بدأ اقتطاع رسوم التأخير من مبلغ الضمان المحتجز (${formatDZD(booking.deposit)}):`,
            `• رسوم التأخير المستحقة حتى الآن: ${formatDZD(lateFee)} (${formatDZD(booking.lateFeePerDay)} لكل يوم تأخير)`,
            '',
            'يرجى إرجاع المعدة في أقرب وقت لتوقّف تراكم الرسوم، وسيُعاد إليك المتبقي من الضمان فور تأكيد التاجر للاستلام.',
            '',
            '— منصة كراء بلا همّ',
          ].join('\n'),
          type: 'LATE_WARNING',
          bookingId: booking.id,
        });
        warningsSent += 1;
        await db.booking.update({
          where: { id: booking.id },
          data: { lateWarningSent: true },
        });
      }
    } else {
      // OVERDUE already — keep fee accrual fresh
      await db.booking.update({
        where: { id: booking.id },
        data: { lateFee },
      });
    }
  }

  return {
    checked: active.length,
    newlyOverdue,
    warningsSent,
    totalLateFees,
  };
}
