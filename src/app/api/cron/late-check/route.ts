// ─── GET /api/cron/late-check — manual trigger of the late sweep ──────
// The 30s background scheduler (instrumentation.ts) runs the same job;
// this endpoint exists for manual triggers and demos.

import { NextResponse } from 'next/server';
import { runLateCheck } from '@/lib/late-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await runLateCheck();
  return NextResponse.json(result);
}
