// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Uploaded File Serving
// GET /api/files/<...path>
//
// Serves evidence files stored under the DB data volume
// (<DATABASE_URL dirname>/uploads). Required because runtime files
// are NOT served by static handlers in Next standalone output.
//
// Guards:
//  - session required
//  - resolved-path prefix check (no traversal)
//  - extension whitelist (jpg/png/mp4)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getSessionFromRequest, authRequiredResponse } from '@/lib/auth-server';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
};

function storageRoot(): string {
  const url = process.env.DATABASE_URL || 'file:./db/dev.db';
  const dbPath = url.startsWith('file:') ? url.slice('file:'.length) : './db';
  return path.join(path.resolve(path.dirname(dbPath)), 'uploads');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return authRequiredResponse();

  const { path: segments } = await params;
  const root = storageRoot();
  const target = path.resolve(root, ...segments);

  // Traversal guard: the resolved target must stay inside the uploads root
  if (target !== root && !target.startsWith(root + path.sep)) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'مسار غير مصرح به', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const ext = path.extname(target).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'صيغة غير مدعومة', code: 'UNSUPPORTED_MEDIA_TYPE' },
      { status: 403 }
    );
  }

  try {
    const data = await readFile(target);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(data.byteLength),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, dignity_preserved: true, message_ar: 'الملف غير موجود', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }
}
