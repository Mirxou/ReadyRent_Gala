// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Wallet Transfer API
// POST /api/wallet/transfer
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
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

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'المبلغ يجب أن يكون رقماً موجباً',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Find sender
    const sender = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!sender) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'المستخدم غير موجود',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check sufficient balance
    if (sender.walletBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'رصيد المحفظة غير كافي لإتمام التحويل',
          code: 'INSUFFICIENT_BALANCE',
        },
        { status: 400 }
      );
    }

    // Find recipient by username
    const recipient = await db.user.findUnique({
      where: { username: recipient_username },
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

    // Can't transfer to self
    if (sender.id === recipient.id) {
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

    // Perform transfer in a Prisma transaction
    const transferNote = note || `تحويل من ${sender.username || sender.firstName || sender.email}`;

    await db.$transaction([
      // Decrement sender balance
      db.user.update({
        where: { id: sender.id },
        data: { walletBalance: { decrement: amount } },
      }),
      // Increment recipient balance
      db.user.update({
        where: { id: recipient.id },
        data: { walletBalance: { increment: amount } },
      }),
      // Create sender transaction record
      db.transaction.create({
        data: {
          userId: sender.id,
          type: 'TRANSFER',
          amount: amount,
          note: transferNote,
          hash: `tx_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      }),
      // Create recipient transaction record
      db.transaction.create({
        data: {
          userId: recipient.id,
          type: 'INCOME',
          amount: amount,
          note: transferNote,
          hash: `tx_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        },
      }),
    ]);

    // Fetch updated sender wallet info
    const updatedSender = await db.user.findUnique({
      where: { id: sender.id },
      select: { walletBalance: true, id: true },
    });

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        wallet_balance: updatedSender?.walletBalance ?? 0,
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
