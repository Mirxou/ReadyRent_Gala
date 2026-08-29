import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return authRequiredResponse();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    if (!productId) {
      return NextResponse.json(
        { success: false, dignity_preserved: true, message_en: 'product_id required' },
        { status: 400 }
      );
    }

    const wishlist = await db.wishlist.findFirst({
      where: { userId: session.userId, productId },
    });

    return NextResponse.json({ success: true, dignity_preserved: true, data: { in_wishlist: !!wishlist } });
  } catch (_error) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_en: 'Server error' },
      { status: 500 }
    );
  }
}
