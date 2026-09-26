// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Late-Return Sweep (GRAFT: كراء بلا همّ P0)
// One pass, idempotent, safe to run on an interval:
//   1. confirmed/active bookings past endDate → status "overdue",
//      late fee rate frozen (30% of daily price), first pass sends
//      the ONE-TIME warning email ("fees now eat your deposit").
//   2. already-overdue bookings keep accruing, capped at depositHeld.
// The customer is never silently charged — the warning comes first.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import {
  computeAccruedLateFee,
  computeLateFeePerDay,
  formatDZD,
} from '@/lib/escrow';
import { queueEmail, renderEmailHtml } from '@/lib/email-outbox';

export interface LateCheckSummary {
  newlyOverdue: number;
  accrued: number;
  warningsSent: number;
  errors: number;
}

function daysLateFrom(endDate: string | null | undefined, now: Date): number {
  if (!endDate) return 0;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 0;
  const ms = now.getTime() - end.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export async function runLateCheck(now = new Date()): Promise<LateCheckSummary> {
  const summary: LateCheckSummary = {
    newlyOverdue: 0,
    accrued: 0,
    warningsSent: 0,
    errors: 0,
  };

  // Anything rented, escrow-funded, and past its end date.
  const candidates = await db.booking.findMany({
    where: {
      status: { in: ['confirmed', 'active', 'overdue'] },
      escrowStatus: 'held',
    },
    include: {
      product: { select: { pricePerDay: true, depositAmount: true, nameAr: true } },
      user: { select: { email: true } },
    },
  });

  for (const booking of candidates) {
    const late = daysLateFrom(booking.endDate, now);
    if (late === 0) continue;

    try {
      const depositHeld =
        booking.depositHeld > 0 ? booking.depositHeld : booking.product.depositAmount;
      const lateFeePerDay =
        booking.lateFeePerDay > 0
          ? booking.lateFeePerDay
          : computeLateFeePerDay(booking.product.pricePerDay);
      const accruedFee = computeAccruedLateFee(late, lateFeePerDay, depositHeld);

      const wasOverdue = booking.status === 'overdue';

      await db.booking.update({
        where: { id: booking.id },
        data: {
          status: 'overdue',
          depositHeld,
          lateFeePerDay,
          lateFee: accruedFee,
          overdueAt: booking.overdueAt ?? now,
        },
      });

      if (!wasOverdue) summary.newlyOverdue += 1;
      else summary.accrued += 1;

      // One-shot human warning BEFORE fees bite. Never sent twice.
      if (!booking.lateWarningSent && booking.user?.email) {
        await queueEmail({
          to: booking.user.email,
          kind: 'LATE_WARNING',
          bookingId: booking.id,
          userId: booking.userId,
          subject: `⚠️ تأخير في الإرجاع — ${booking.productName ?? booking.product.nameAr}`,
          html: renderEmailHtml(
            'تأخير في إرجاع المنتج',
            `<p>لم يتم إرجاع <strong>${booking.productName ?? booking.product.nameAr}</strong> في الموعد المحدد.</p>
             <p>بدأت غرامة التأخير تُحتسب بمعدل <strong>${formatDZD(lateFeePerDay)} / يوم</strong>،
             وسيتم الخصم مباشرة من وديعتك المحتجزة (${formatDZD(depositHeld)}).</p>
             <p>أقصى ما يمكن خصمه هو قيمة الوديعة كاملة. يرجى التواصل مع التاجر لإرجاع المنتج في أقرب وقت.</p>`
          ),
        });
        await db.notification.create({
          data: {
            userId: booking.userId,
            type: 'financial',
            title: 'تأخير في الإرجاع',
            message: `بدأت غرامة التأخير (${formatDZD(lateFeePerDay)}/يوم) تُخصم من وديعتك المحتجزة.`,
          },
        });
        await db.booking.update({
          where: { id: booking.id },
          data: { lateWarningSent: true },
        });
        summary.warningsSent += 1;
      }
    } catch {
      summary.errors += 1;
    }
  }

  return summary;
}
