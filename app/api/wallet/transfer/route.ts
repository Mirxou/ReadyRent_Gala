// ═══════════════════════════════════════════════════
// STANDARD.Rent — Wallet Transfer API
// POST /api/wallet/transfer
// SECURITY: Zod validated, rate limited, atomic balance check
// ═══════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';
import { checkWalletRateLimit } from '@/lib/rate-limiter';
import { walletTransferSchema, validateBody } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    // ── Rate limiting ──
    const rateCheck = checkWalletRateLimit(session.userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'Too many wallet operations', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // ── Zod validation ──
    const vResult = validateBody(walletTransferSchema, body);
    if (!vResult.success) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: vResult.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { recipient_id, amount, note } = vResult.data;

    // Verify recipient exists and is active
    const recipient = await db.user.findUnique({
      where: { id: recipient_id },
      select: { id: true, username: true, isActive: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'المستلم غير موجود', code: 'RECIPIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!recipient.isActive) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'حساب المستلم معطل', code: 'RECIPIENT_INACTIVE' },
        { status: 400 }
      );
    }

    // Can't transfer to self
    if (session.userId === recipient.id) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'لا يمكنك التحويل إلى نفسك', code: 'SELF_TRANSFER' },
        { status: 400 }
      );
    }

    // Atomic transfer
    const result = await db.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true, username: true, firstName: true },
      });

      if (!sender || (sender.walletBalance ?? 0) < amount) {
        return { error: 'INSUFFICIENT_BALANCE' } as const;
      }

      await tx.user.update({
        where: { id: session.userId },
        data: { walletBalance: { decrement: amount } },
      });

      await tx.user.update({
        where: { id: recipient.id },
        data: { walletBalance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId: session.userId,
          type: 'TRANSFER',
          amount,
          note: note || `تحويل لمستخدم ${recipient.username || recipient.id}`,
          hash: `tx_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      });

      await tx.transaction.create({
        data: {
          userId: recipient.id,
          type: 'INCOME',
          amount,
          note: note || `تحويل من مستخدم ${sender.username || sender.firstName}`,
          hash: `tx_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      });

      const updatedSender = await tx.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true },
      });

      return { walletBalance: updatedSender?.walletBalance ?? 0 } as const;
    });

    if ('error' in result) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_ar: 'رصيد غير كافي', code: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        wallet_balance: result.walletBalance,
        recipient_id,
        amount,
        transferred_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Wallet Transfer', 'Error', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'خطأ أثناء التحويل', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
