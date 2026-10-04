import { NextRequest, NextResponse } from 'next/server';
import type { PayoutRequest } from '@prisma/client';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { queueEmail, renderEmailHtml } from '@/lib/email-outbox';
import {
  MIN_PAYOUT_AMOUNT,
  MAX_PAYOUT_AMOUNT,
  PAYOUT_METHOD_LABELS,
  getVendorBalance,
  resolveVendorForUser,
  isPayoutMethod,
  normalizeAccountNumber,
  validateAccountNumber,
} from '@/lib/payouts';

// ═══════════════════════════════════════════════════════════════
// GET  /api/vendors/payout-requests — balance + own requests
// POST /api/vendors/payout-requests — create withdrawal demand
//
// GRAFT PHASE 3: the merchant side of the money-out valve. Chargily
// has no payout API → withdrawal is a human flow, made accountable
// here. Balance is recomputed INSIDE the creation transaction so two
// concurrent requests can never double-spend the same dinar.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, firstName: true, lastName: true, email: true },
  });

  if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'غير مصرح', message_en: 'Unauthorized', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const vendor = await resolveVendorForUser(user.id, fullName);
  if (!vendor) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'لم يتم ربط حسابك بمتجر — تواصل مع الإدارة',
        message_en: 'No vendor store linked to your account — contact administration',
        code: 'NO_VENDOR_LINK',
      },
      { status: 404 }
    );
  }

  const [balance, requests] = await Promise.all([
    getVendorBalance(vendor.id),
    db.payoutRequest.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    success: true,
    dignity_preserved: true,
    data: {
      vendor: { id: vendor.id, name: vendor.name, name_ar: vendor.nameAr },
      balance: {
        earned: balance.earned,
        committed: balance.committed,
        available: balance.available,
        withdrawn: balance.withdrawn,
        pending_requests: balance.pendingRequests,
      },
      min_payout: MIN_PAYOUT_AMOUNT,
      requests: requests.map(r => ({
        id: r.id,
        amount: r.amount,
        method: r.method,
        method_label: PAYOUT_METHOD_LABELS[r.method as keyof typeof PAYOUT_METHOD_LABELS] ?? r.method,
        account_name: r.accountName,
        account_number: r.accountNumber,
        status: r.status,
        admin_note: r.adminNote,
        transfer_ref: r.transferRef,
        processed_at: r.processedAt?.toISOString() ?? null,
        created_at: r.createdAt.toISOString(),
      })),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, firstName: true, lastName: true, email: true },
  });

  if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'غير مصرح', message_en: 'Unauthorized', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const amount = Number(body?.amount);
    const method = body?.method;
    const accountName = typeof body?.account_name === 'string' ? body.account_name.trim() : '';
    const rawAccount = typeof body?.account_number === 'string' ? body.account_number : '';

    // ── Validation ──
    if (!Number.isInteger(amount) || amount < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `أدنى مبلغ للسحب هو ${MIN_PAYOUT_AMOUNT} دج`,
          message_en: `Minimum payout amount is ${MIN_PAYOUT_AMOUNT} DZD`,
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      );
    }
    if (amount > MAX_PAYOUT_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `أقصى مبلغ للسحب في الطلب الواحد هو ${MAX_PAYOUT_AMOUNT} دج`,
          message_en: `Maximum payout amount per request is ${MAX_PAYOUT_AMOUNT} DZD`,
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      );
    }
    if (!isPayoutMethod(method)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'طريقة السحب غير صالحة (ccp | baridimob | rib)',
          message_en: 'Invalid payout method (ccp | baridimob | rib)',
          code: 'INVALID_METHOD',
        },
        { status: 400 }
      );
    }
    if (accountName.length < 3) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'اسم صاحب الحساب مطلوب',
          message_en: 'Account holder name is required',
          code: 'INVALID_ACCOUNT_NAME',
        },
        { status: 400 }
      );
    }
    const accountError = validateAccountNumber(method, rawAccount);
    if (accountError) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: accountError,
          message_en: 'Invalid account number',
          code: 'INVALID_ACCOUNT_NUMBER',
        },
        { status: 400 }
      );
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    const vendor = await resolveVendorForUser(user.id, fullName);
    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لم يتم ربط حسابك بمتجر — تواصل مع الإدارة',
          message_en: 'No vendor store linked to your account — contact administration',
          code: 'NO_VENDOR_LINK',
        },
        { status: 404 }
      );
    }

    const accountNumber = normalizeAccountNumber(rawAccount);

    // ── Atomic creation: balance re-checked inside the transaction ──
    type CreateResult =
      | { ok: false; available: number }
      | { ok: true; available: number; request: PayoutRequest };

    const created: CreateResult = await db.$transaction(async (tx): Promise<CreateResult> => {
      const [earnedAgg, committedAgg] = await Promise.all([
        tx.payoutRecord.aggregate({
          _sum: { amount: true },
          where: { vendorId: vendor.id, status: { not: 'failed' } },
        }),
        tx.payoutRequest.aggregate({
          _sum: { amount: true },
          where: { vendorId: vendor.id, status: { not: 'rejected' } },
        }),
      ]);

      const earned = earnedAgg._sum.amount ?? 0;
      const committed = committedAgg._sum.amount ?? 0;
      const available = Math.max(0, earned - committed);

      if (amount > available) {
        return { ok: false, available };
      }

      return {
        ok: true,
        available,
        request: await tx.payoutRequest.create({
          data: {
            vendorId: vendor.id,
            userId: user.id,
            amount,
            method,
            accountName,
            accountNumber,
            status: 'pending',
          },
        }),
      };
    });

    if (!created.ok) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: `الرصيد المتاح غير كافٍ — المتاح: ${created.available} دج`,
          message_en: `Insufficient available balance — available: ${created.available} DZD`,
          code: 'INSUFFICIENT_BALANCE',
        },
        { status: 400 }
      );
    }

    logger.info('Payout Request', `Vendor ${vendor.id} requested withdrawal of ${amount} DZD`, {
      payoutRequestId: created.request.id,
      vendorId: vendor.id,
      userId: user.id,
      amount,
      method,
    });

    // ── Outbox: confirmation to vendor (never fails the request) ──
    try {
      if (user.email) {
        await queueEmail({
          to: user.email,
          kind: 'PAYOUT_REQUESTED',
          userId: user.id,
          subject: 'تم استلام طلب السحب — قيد المعالجة',
          html: renderEmailHtml(
            'طلب سحب أرباح',
            `<p>مرحباً ${user.firstName || ''}،</p><p>تم استلام طلب سحب بقيمة <b>${amount} دج</b> إلى ${PAYOUT_METHOD_LABELS[method]} (الحساب: ${accountNumber}).</p><p>سيتم مراجعة الطلب وتحويل المبلغ من قبل الإدارة في أقرب وقت.</p>`
          ),
        });
      }
    } catch (e) {
      logger.error('Payout Request', 'Outbox email failed (non-fatal)', e);
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        id: created.request.id,
        amount: created.request.amount,
        method: created.request.method,
        status: created.request.status,
        available_after: created.available - amount,
      },
    });
  } catch (error) {
    logger.error('Payout Request API', 'Error creating payout request', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء إنشاء طلب السحب',
        message_en: 'An error occurred while creating the payout request',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
