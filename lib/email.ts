// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Email Service (Resend)
// Gracefully handles missing RESEND_API_KEY — logs warning instead of crashing
// ═══════════════════════════════════════════════════════════════

import Resend from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend) {
  console.warn(
    '[EMAIL] RESEND_API_KEY not set — emails will be logged but not sent.'
  );
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; messageId: string | null }> {
  if (!resend) {
    console.warn(
      '[EMAIL] RESEND_API_KEY not set — email not sent:',
      subject,
      '→',
      to
    );
    return { success: false, messageId: null };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || 'STANDARD.Rent <noreply@standardrent.dz>',
      to,
      subject,
      html,
    });

    if (error) throw error;

    console.warn('[EMAIL] Sent:', subject, '→', to, '| ID:', data?.id);
    return { success: true, messageId: data?.id ?? null };
  } catch (err) {
    console.error('[EMAIL] Failed:', err);
    return { success: false, messageId: null };
  }
}
