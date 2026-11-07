// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Dispute Evidence Upload
// POST /api/disputes/[id]/evidence  (multipart/form-data, field: file)
//
// Completes the green-sweep promise: evidence-step.tsx (live in the
// dispute wizard) calls disputesApi.uploadEvidence() which targets
// this route. Files are stored on the DB data volume (derived from
// DATABASE_URL file: dirname — docker /app/data) and served back
// through GET /api/files/disputes/<name>.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';
import { logger } from '@/lib/logger';

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['video/mp4', '.mp4'],
]);

// Storage root lives next to the SQLite file so it inherits the same
// persistent volume in every environment (dev: ./db/uploads, docker: /app/data/uploads).
function storageRoot(): string {
  const url = process.env.DATABASE_URL || 'file:./db/dev.db';
  const dbPath = url.startsWith('file:') ? url.slice('file:'.length) : './db';
  return path.join(path.resolve(path.dirname(dbPath)), 'uploads');
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  try {
    const { id } = await params;

    const dispute = await db.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            product: { select: { vendorId: true } },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'النزاع غير موجود',
          message_en: 'Dispute not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Authorization: dispute owner, vendor, or admin/staff (mirrors messages route)
    const isOwner = dispute.userId === session.userId;
    const isVendor = dispute.booking?.product?.vendorId === session.userId;
    const currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

    if (!isOwner && !isVendor && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'غير مصرح برفع أدلة إلى هذا النزاع',
          message_en: 'Not authorized to upload evidence to this dispute',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'ملف الدليل مطلوب (حقل file)',
          message_en: 'Evidence file is required (file field)',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES.get(file.type);
    if (!ext) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'صيغة غير مدعومة — JPG أو PNG أو MP4 فقط',
          message_en: 'Unsupported type — JPG, PNG or MP4 only',
          code: 'UNSUPPORTED_MEDIA_TYPE',
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_EVIDENCE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          dignity_preserved: true,
          message_ar: 'حجم الملف يتجاوز الحد الأقصى (10 ميجابايت)',
          message_en: 'File exceeds the 10MB limit',
          code: 'FILE_TOO_LARGE',
        },
        { status: 413 }
      );
    }

    const dir = path.join(storageRoot(), 'disputes');
    await mkdir(dir, { recursive: true });

    const name = `${crypto.randomUUID()}${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), bytes);

    logger.info('DisputeEvidence', `uploaded ${name} for dispute ${id} by ${session.userId}`);

    return NextResponse.json({
      success: true,
      dignity_preserved: true,
      data: {
        url: `/api/files/disputes/${name}`,
        id: name,
      },
    });
  } catch (error) {
    logger.error('DisputeEvidence', 'Upload failed', error);
    return NextResponse.json(
      {
        success: false,
        dignity_preserved: true,
        message_ar: 'فشل رفع الدليل، يرجى المحاولة مرة أخرى',
        message_en: 'Evidence upload failed',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
