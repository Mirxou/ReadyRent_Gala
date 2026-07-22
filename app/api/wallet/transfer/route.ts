// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Wallet Transfer API
// POST /api/wallet/transfer
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();
    const { recipient_username, amount, note } = body;

    // Validation
    if (!recipient_username || typeof recipient_username !== 'string') {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'اسم المستلم مطلوب',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'المبلغ يجب أن يكون رقماً صحيحاً موجباً',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Find recipient by username and verify active
    const recipient = await db.user.findFirst({
      where: { username: recipient_username },
      select: { id: true, username: true, isActive: true },
    });

    if (!recipient) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لم يتم العثور على مستخدم باسم المستخدم المحدد',
          code: 'RECIPIENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (!recipient.isActive) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'حساب المستلم معطل ولا يمكن استلام التحويلات',
          code: 'RECIPIENT_INACTIVE',
        },
        { status: 400 }
      );
    }

    // Can't transfer to self
    if (session.userId === recipient.id) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'لا يمكنك التحويل إلى نفسك',
          code: 'SELF_TRANSFER',
        },
        { status: 400 }
      );
    }

    // Use interactive transaction to atomically check balance and transfer
    const transferNote = note || `تحويل لمستخدم ${recipient.username || recipient.id}`;

    const result = await db.$transaction(async (tx) => {
      // Read sender balance inside transaction
      const sender = await tx.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true, username: true, firstName: true },
      });

      if (!sender || (sender.walletBalance ?? 0) < amount) {
        return { error: 'INSUFFICIENT_BALANCE' } as const;
      }

      const finalNote = transferNote || `تحويل من ${sender.username || sender.firstName || 'مستخدم'}`;

      // Decrement sender
      await tx.user.update({
        where: { id: session.userId },
        data: { walletBalance: { decrement: amount } },
      });

      // Increment recipient
      await tx.user.update({
        where: { id: recipient.id },
        data: { walletBalance: { increment: amount } },
      });

      // Create sender transaction record
      const senderTx = await tx.transaction.create({
        data: {
          userId: session.userId,
          type: 'TRANSFER',
          amount,
          note: finalNote,
          hash: `tx_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      });

      // Create recipient transaction record
      const recipientTx = await tx.transaction.create({
        data: {
          userId: recipient.id,
          type: 'INCOME',
          amount,
          note: finalNote,
          hash: `tx_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      });

      // Read updated sender balance inside transaction
      const updatedSender = await tx.user.findUnique({
        where: { id: session.userId },
        select: { walletBalance: true },
      });

      return { walletBalance: updatedSender?.walletBalance ?? 0, senderTx, recipientTx } as const;
    });

    if ('error' in result) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رصيد المحفظة غير كافي لإتمام التحويل',
          code: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        wallet_balance: result.walletBalance,
        recipient_username: recipient.username,
        amount,
        transferred_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Wallet Transfer] Error:', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'حدث خطأ أثناء التحويل، يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
