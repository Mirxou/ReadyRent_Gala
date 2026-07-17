import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// DELETE /api/bookings/cart/items/[id] — Remove cart item
// ═══════════════════════════════════════════════════════════════
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const { id } = await params;
  const item = await db.cartItem.findUnique({ where: { id } });

  if (!item || item.userId !== session.userId) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Cart item not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  await db.cartItem.delete({ where: { id } });

  return NextResponse.json({
    success: true,
    dignity_preserved: true,
    data: { id },
  });
  } catch (error) {
    console.error('[Cart Items API] Error:', error);
    return NextResponse.json(
      { success: false, dignity_preserved: true, message: 'Internal error' },
      { status: 500 }
    );
  }
}