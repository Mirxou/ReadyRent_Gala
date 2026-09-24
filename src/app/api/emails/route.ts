// ─── GET /api/emails — email outbox (newest first) ────────────────────
// Query: limit (default 50, capped 200), bookingId (optional filter).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { toEmailDTO } from '@/lib/dto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const bookingId = sp.get('bookingId');

  const limitRaw = Number(sp.get('limit') ?? '50');
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), 200)
      : 50;

  const emails = await db.emailLog.findMany({
    where: bookingId ? { bookingId } : undefined,
    orderBy: { sentAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ emails: emails.map((e) => toEmailDTO(e)) });
}
