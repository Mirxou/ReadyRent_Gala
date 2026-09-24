// ─── Email notifications (P2) — simulated provider with DB outbox ────
// In production this would call a real provider (SMTP / Resend / SES).
// Here every sendEmail() is persisted to the EmailLog outbox so the
// platform's "voice" is fully inspectable from the UI.

import { db } from '@/lib/db';
import type { EmailType } from '@/lib/types';

export interface SendEmailInput {
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  type: EmailType;
  bookingId?: string | null;
}

export async function sendEmail(input: SendEmailInput) {
  const log = await db.emailLog.create({
    data: {
      toEmail: input.toEmail,
      toName: input.toName,
      subject: input.subject,
      body: input.body,
      type: input.type,
      bookingId: input.bookingId ?? null,
    },
  });
  console.log(`📧 [sendEmail] "${input.subject}" → ${input.toEmail} (${input.type})`);
  return log;
}
