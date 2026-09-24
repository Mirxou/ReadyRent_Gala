// ─── GET /api/customers — list all customers ──────────────────────────

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toCustomerDTO } from '@/lib/dto';

export const dynamic = 'force-dynamic';

export async function GET() {
  const customers = await db.customer.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ customers: customers.map((c) => toCustomerDTO(c)) });
}
