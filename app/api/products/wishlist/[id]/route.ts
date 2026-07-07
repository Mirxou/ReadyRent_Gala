import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

// ═══════════════════════════════════════════════════════════════
// DELETE /api/products/wishlist/[id] — Remove from wishlist
// ═══════════════════════════════════════════════════════════════
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const { id } = await params;
  const item = await db.wishlist.findUnique({ where: { id } });

  if (!item || item.userId !== session.userId) {
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_en: 'Wishlist item not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  await db.wishlist.delete({ where: { id } });

  return NextResponse.json({
    success: true,
    dignity_preserved: true,
    data: { id },
  });
}