import { createServer } from 'http';
import { Server } from 'socket.io';
import { Database } from 'bun:sqlite';
import { createHmac, timingSafeEqual } from 'crypto';

// ──── Configuration ────
const AUTH_SECRET = process.env.NEXTAUTH_SECRET || '';
if (!AUTH_SECRET) {
  console.error('[AUTH] NEXTAUTH_SECRET not set — WebSocket auth will reject all connections');
}

const DB_PATH = process.env.DB_PATH || '/home/z/my-project/db/custom.db';

const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://21.0.21.29:3000'];

const AUTH_TIMEOUT_MS = 10_000; // 10 seconds

// ──── SQLite (read-only — shared with Next.js Prisma) ────
let db: Database | null = null;
try {
  db = new Database(DB_PATH, { readonly: true });
} catch (err) {
  console.error(`[DB] Failed to open ${DB_PATH}:`, err);
}

// ──── HMAC Token Verification ────
// Matches auth-server.ts verifyTokenSignature()
function verifyTokenSignature(signedToken: string): string | null {
  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const rawToken = signedToken.slice(0, dotIndex);
  const providedHmac = signedToken.slice(dotIndex + 1);

  const expectedHmac = createHmac('sha256', AUTH_SECRET)
    .update(rawToken)
    .digest('hex');

  try {
    if (!timingSafeEqual(Buffer.from(providedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }

  return rawToken;
}

// ──── Session Validation ────
// Table name is "sessions" (Prisma @@map("sessions") from model Session)
function validateSession(signedToken: string): { userId: string } | null {
  if (!AUTH_SECRET || !db) return null;

  const rawToken = verifyTokenSignature(signedToken);
  if (!rawToken) return null;

  const row = db.query<{ userId: string }>(
    `SELECT "userId" FROM sessions WHERE token = ? AND expires_at > datetime('now') LIMIT 1`
  ).get(rawToken);

  return row ?? null;
}

// ──── Extract session_token from cookie string ────
function extractSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session_token=([^;]+)/);
  return match ? match[1] : null;
}

// ──── HTTP + Socket.IO Server ────
const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const PORT = 3004;

// userId -> Set<socket.id>
const userSockets = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  let isAuthenticated = false;
  let authTimeout: ReturnType<typeof setTimeout> | null = null;

  // ──── Helper: join user room and track socket ────
  function joinUserRoom(userId: string) {
    socket.data.userId = userId;
    isAuthenticated = true;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Clear auth timeout if set
    if (authTimeout) {
      clearTimeout(authTimeout);
      authTimeout = null;
    }

    socket.emit('joined', { userId, status: 'connected' });
    console.log(`[WS] Socket ${socket.id} authenticated as user ${userId}`);
  }

  // ──── Helper: disconnect unauthenticated socket ────
  function disconnectUnauthenticated() {
    console.log(`[WS] Socket ${socket.id} disconnected — auth timeout`);
    socket.disconnect(true);
  }

  // ──── 1. Try cookie-based auth from handshake immediately ────
  const cookieHeader = socket.request.headers.cookie;
  const tokenFromCookie = extractSessionToken(cookieHeader);

  if (tokenFromCookie) {
    const session = validateSession(tokenFromCookie);
    if (session) {
      joinUserRoom(session.userId);
    }
  }

  // ──── 2. If not yet authenticated, wait for explicit authenticate event ────
  if (!isAuthenticated) {
    authTimeout = setTimeout(disconnectUnauthenticated, AUTH_TIMEOUT_MS);
  }

  // ──── authenticate event (fallback for programmatic clients) ────
  socket.on('authenticate', (data: { token: string }) => {
    if (isAuthenticated) return; // Already authenticated

    if (!data?.token) {
      socket.emit('auth_error', { message: 'Token required' });
      return;
    }

    const session = validateSession(data.token);
    if (!session) {
      socket.emit('auth_error', { message: 'Invalid or expired token' });
      socket.disconnect(true);
      return;
    }

    joinUserRoom(session.userId);
  });

  // ──── Legacy join event — ignored if already authenticated, rejected otherwise ────
  socket.on('join', () => {
    if (isAuthenticated) {
      // Already joined via auth — no-op
      return;
    }
    // Reject unauthenticated join attempts
    socket.emit('auth_error', { message: 'Authentication required. Send authenticate event with token.' });
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', () => {
    if (authTimeout) {
      clearTimeout(authTimeout);
      authTimeout = null;
    }

    const userId = socket.data.userId as string | undefined;
    if (userId) {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    }
  });
});

// Expose for programmatic use (e.g., sending notifications from main app)
export { io, userSockets, PORT };

httpServer.listen(PORT, () => {
  console.log(`Notifications WebSocket service running on port ${PORT}`);
  console.log(`[AUTH] CORS restricted to: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Notifications service shutting down...');
  httpServer.close(() => {
    if (db) db.close();
    console.log('Notifications service closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Notifications service shutting down...');
  httpServer.close(() => {
    if (db) db.close();
    console.log('Notifications service closed');
    process.exit(0);
  });
});
