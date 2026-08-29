import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const body = await request.json();
    const productId: string | undefined = body.product_id;
    if (!productId) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'product_id required' },
        { status: 400 }
      );
    }

    const existing = await db.wishlist.findFirst({
      where: { userId: session.userId, productId },
    });

    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, dignity_preserved: true, data: { in_wishlist: false } });
    } else {
      await db.wishlist.create({ data: { userId: session.userId, productId } });
      return NextResponse.json({ success: true, dignity_preserved: true, data: { in_wishlist: true } });
    }
  } catch (_error) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Server error' },
      { status: 500 }
    );
  }
}
