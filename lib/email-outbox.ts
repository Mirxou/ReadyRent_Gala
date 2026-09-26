// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Email Outbox (GRAFT: كراء بلا همّ P2)
// Fuses two worlds: the durable EmailLog audit trail (ours) with
// the Resend provider already wired in lib/email.ts (theirs).
//
// Contract: queueEmail() persists BEFORE delivering. A Resend outage
// degrades delivery, never the audit trail. outbox-tab / admin can
// replay or inspect any message later.
// ═══════════════════════════════════════════════════════════════

import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export type EmailKind =
  | 'PAYMENT_RECEIPT'
  | 'MERCHANT_ORDER_ALERT'
  | 'LATE_WARNING'
  | 'ESCROW_RELEASED'
  | 'REVIEW_INVITE';

export interface QueueEmailInput {
  to: string;
  subject: string;
  html: string;
  kind: EmailKind;
  bookingId?: string | null;
  userId?: string | null;
}

export interface QueueEmailResult {
  logId: string;
  status: 'sent' | 'failed' | 'queued';
  error?: string;
}

/**
 * Persist an email to the outbox, then attempt delivery via Resend.
 * Never throws — a notification failure must not fail the business
 * transaction that triggered it (payment, release, overdue sweep).
 */
export async function queueEmail(input: QueueEmailInput): Promise<QueueEmailResult> {
  const log = await db.emailLog.create({
    data: {
      to: input.to,
      subject: input.subject,
      kind: input.kind,
      bookingId: input.bookingId ?? null,
      userId: input.userId ?? null,
      status: 'queued',
    },
  });

  try {
    const result = await sendEmail({
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (result.success) {
      await db.emailLog.update({ where: { id: log.id }, data: { status: 'sent' } });
      return { logId: log.id, status: 'sent' };
    }

    const error = 'provider returned success=false';
    await db.emailLog.update({ where: { id: log.id }, data: { status: 'failed', error } });
    return { logId: log.id, status: 'failed', error };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await db.emailLog.update({ where: { id: log.id }, data: { status: 'failed', error } });
    return { logId: log.id, status: 'failed', error };
  }
}

/** Simple HTML wrapper — Arabic-first, RTL, consistent with the platform voice. */
export function renderEmailHtml(title: string, bodyHtml: string): string {
  return `
  <div dir="rtl" style="font-family:'Cairo',Tahoma,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
    <h2 style="color:#111827;margin:0 0 12px;">${title}</h2>
    <div style="color:#374151;font-size:14px;line-height:1.8;">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
    <p style="color:#9ca3af;font-size:12px;margin:0;">STANDARD.Rent — كراء بلا همّ · هذا بريد آلي من منصة الثقة</p>
  </div>`;
}
