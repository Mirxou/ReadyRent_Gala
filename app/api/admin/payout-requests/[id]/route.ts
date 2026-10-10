import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { queueEmail, renderEmailHtml } from '@/lib/email-outbox';
import { PAYOUT_METHOD_LABELS } from '@/lib/payouts';

// ═══════════════════════════════════════════════════════════════
// PATCH /api/admin/payout-requests/[id]
// GRAFT PHASE 3: the admin side of the money-out valve.
//
// State machine (money discipline):
//   pending  → approved   (admin acknowledged, transfer scheduled)
//   pending  → paid       (same-day transfer — allowed, ref required)
//   approved → paid       (normal path — transfer ref required)
//   pending/approved → rejected  (reason required)
//   terminal: paid, rejected — no further transitions.
//
// Concurrency: the transition is an updateMany guarded by the expected
// source status — two admins racing on the same request yield exactly
// one winner; the loser gets 409, never a double state.
// ═══════════════════════════════════════════════════════════════

type Action = 'approve' | 'reject' | 'mark_paid';

const ALLOWED_TRANSITIONS: Record<Action, string[]> = {
  approve: ['pending'],
  reject: ['pending', 'approved'],
  mark_paid: ['pending', 'approved'],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const admin = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });
  if (!admin || (admin.role !== 'admin' && admin.role !== 'staff')) {
    return NextResponse.json(
      { success: false, message_en: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const action = body?.action as Action | undefined;
    const note = typeof body?.note === 'string' ? body.note.trim() : '';
    const transferRef = typeof body?.transfer_ref === 'string' ? body.transfer_ref.trim() : '';

    if (!action || !(action in ALLOWED_TRANSITIONS)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'إجراء غير صالح (approve | reject | mark_paid)',
          message_en: 'Invalid action (approve | reject | mark_paid)',
          code: 'INVALID_ACTION',
        },
        { status: 400 }
      );
    }

    if (action === 'reject' && note.length < 3) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'سبب الرفض مطلوب',
          message_en: 'A rejection reason is required',
          code: 'REASON_REQUIRED',
        },
        { status: 400 }
      );
    }

    if (action === 'mark_paid' && transferRef.length < 3) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'مرجع الحوالة مطلوب لتوثيق الدفع',
          message_en: 'A transfer reference is required to document the payment',
          code: 'TRANSFER_REF_REQUIRED',
        },
        { status: 400 }
      );
    }

    const payoutRequest = await db.payoutRequest.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true, nameAr: true } },
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (!payoutRequest) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'طلب السحب غير موجود',
          message_en: 'Payout request not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (!ALLOWED_TRANSITIONS[action].includes(payoutRequest.status)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `لا يمكن تنفيذ الإجراء: الطلب حالته "${payoutRequest.status}"`,
          message_en: `Cannot apply action: request is "${payoutRequest.status}"`,
          code: 'INVALID_TRANSITION',
        },
        { status: 409 }
      );
    }

    const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'paid';

    // ── Guarded transition: only wins if the status is still what we saw ──
    const transition = await db.payoutRequest.updateMany({
      where: { id, status: { in: ALLOWED_TRANSITIONS[action] } },
      data: {
        status: nextStatus,
        adminNote: note || payoutRequest.adminNote,
        transferRef: action === 'mark_paid' ? transferRef : payoutRequest.transferRef,
        processedBy: admin.id,
        processedAt: new Date(),
      },
    });

    if (transition.count === 0) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'تم تغيير حالة الطلب للتو بواسطة عملية أخرى',
          message_en: 'Request status was just changed by another operation',
          code: 'CONCURRENT_MODIFICATION',
        },
        { status: 409 }
      );
    }

    logger.info('Payout Admin', `Payout request ${id} → ${nextStatus} by ${admin.id}`, {
      payoutRequestId: id,
      action,
      amount: payoutRequest.amount,
      vendorId: payoutRequest.vendorId,
    });

    // ── Outbox: vendor emails (never fatal) ──
    try {
      const email = payoutRequest.user?.email;
      if (email) {
        const methodLabel =
          PAYOUT_METHOD_LABELS[payoutRequest.method as keyof typeof PAYOUT_METHOD_LABELS] ??
          payoutRequest.method;
        if (action === 'approve') {
          await queueEmail({
            to: email,
            kind: 'PAYOUT_APPROVED',
            userId: payoutRequest.userId,
            subject: 'تمت الموافقة على طلب السحب — جاري التحويل',
            html: renderEmailHtml(
              'الموافقة على السحب',
              `<p>مرحباً ${payoutRequest.user?.firstName || ''}،</p><p>تمت الموافقة على طلب سحب <b>${payoutRequest.amount} دج</b> إلى ${methodLabel}. سيتم تنفيذ الحوالة قريباً وستصلك بياناتها.</p>`
            ),
          });
        } else if (action === 'mark_paid') {
          await queueEmail({
            to: email,
            kind: 'PAYOUT_PAID',
            userId: payoutRequest.userId,
            subject: `تم تحويل ${payoutRequest.amount} دج — أرباحك في طريقها`,
            html: renderEmailHtml(
              'تم تحويل الأرباح',
              `<p>مرحباً ${payoutRequest.user?.firstName || ''}،</p><p>تم تحويل <b>${payoutRequest.amount} دج</b> إلى ${methodLabel} (الحساب: ${payoutRequest.accountNumber}).</p><p>مرجع الحوالة: <b>${transferRef}</b> — احتفظ به للمراجعة.</p><p>شكراً لثقتك — كراء بلا همّ.</p>`
            ),
          });
        } else {
          await queueEmail({
            to: email,
            kind: 'PAYOUT_REJECTED',
            userId: payoutRequest.userId,
            subject: 'تم رفض طلب السحب — وسبب ذلك',
            html: renderEmailHtml(
              'رفض طلب السحب',
              `<p>مرحباً ${payoutRequest.user?.firstName || ''}،</p><p>تم رفض طلب سحب <b>${payoutRequest.amount} دج</b>.</p><p>السبب: <b>${note}</b></p><p>المبلغ يعود تلقائياً إلى رصيدك المتاح ويمكنك إعادة المحاولة بعد تصحيح بيانات الحساب.</p>`
            ),
          });
        }
      }
    } catch (e) {
      logger.error('Payout Admin', 'Outbox email failed (non-fatal)', e);
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id,
        status: nextStatus,
        processed_by: admin.id,
        processed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Payout Admin API', 'Error processing payout request', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء معالجة طلب السحب',
        message_en: 'An error occurred while processing the payout request',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
