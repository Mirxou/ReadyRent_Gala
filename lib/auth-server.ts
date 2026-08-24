// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Server-Side Auth Utilities
// Signed session tokens using NEXTAUTH_SECRET (HMAC-SHA256)
// Sessions stored in database (survives restarts, shared across instances)
// ═══════════════════════════════════════════════════════════════

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { db } from './db';

// ──── Session Signing Secret ────
const _authSecret = process.env.NEXTAUTH_SECRET || '';
if (!_authSecret) {
  console.error('[AUTH] NEXTAUTH_SECRET غير معرّف في .env — المصادقة لن تعمل');
}
const AUTH_SECRET = _authSecret;

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ──── Expired Session Cleanup ────
// Runs once on module load to purge stale sessions from the database.
let cleanupRan = false;
async function cleanupExpiredSessions() {
  if (cleanupRan) return;
  cleanupRan = true;
  try {
    const result = await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      console.warn(`[AUTH] Cleaned up ${result.count} expired session(s)`);
    }
  } catch (error) {
    console.error('[AUTH] Failed to cleanup expired sessions:', error);
  }
}
// Fire-and-forget cleanup on startup
cleanupExpiredSessions();

// ──── Token Signing ────
// Tokens are HMAC-signed so they cannot be forged even if the session
// store is compromised. Format: <rawUuid>.<hmacHex>

function signToken(rawToken: string): string {
  const hmac = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(rawToken)
    .digest('hex');
  return `${rawToken}.${hmac}`;
}

function verifyTokenSignature(signedToken: string): string | null {
  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const rawToken = signedToken.slice(0, dotIndex);
  const providedHmac = signedToken.slice(dotIndex + 1);

  const expectedHmac = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(rawToken)
    .digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(providedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }

  return rawToken;
}

export function generateSessionToken(): string {
  const raw = `sess_${crypto.randomUUID().replace(/-/g, '')}`;
  return signToken(raw);
}

export async function createSession(userId: string): Promise<string> {
  const signedToken = generateSessionToken();
  const rawToken = verifyTokenSignature(signedToken)!;
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      userId,
      token: rawToken,
      expiresAt,
    },
  });

  return signedToken;
}

export async function validateSession(signedToken: string): Promise<{ userId: string } | null> {
  const rawToken = verifyTokenSignature(signedToken);
  if (!rawToken) return null;

  const session = await db.session.findUnique({ where: { token: rawToken } });
  if (!session) return null;

  // Check expiry — delete if expired
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return { userId: session.userId };
}

export async function destroySession(signedToken: string): Promise<void> {
  const rawToken = verifyTokenSignature(signedToken);
  if (!rawToken) return;

  try {
    await db.session.deleteMany({ where: { token: rawToken } });
  } catch {
    // Silently ignore — session may already be deleted
  }
}

export async function getSessionFromRequest(request: Request): Promise<{ userId: string; token: string } | null> {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const signedToken = authHeader.slice(7);
    const session = await validateSession(signedToken);
    if (session) return { ...session, token: signedToken };
  }

  // Check cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  if (match) {
    const signedToken = match[1];
    const session = await validateSession(signedToken);
    if (session) return { ...session, token: signedToken };
  }

  return null;
}

// ──── Password Utilities ────

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// ──── Authentication ────

export async function authenticateUser(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

// ──── User Response Helper ────
// Formats user data for API responses (never includes passwordHash or 2FA secret)

export function formatUserResponse(user: {
  id: string;
  email: string;
  username: string | null;
  role: string;
  trustScore: number;
  walletBalance: number;
  isVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  is2FaEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    is_verified: user.isVerified,
    trust_score: user.trustScore,
    wallet_balance: user.walletBalance,
    first_name: user.firstName,
    last_name: user.lastName,
    phone: user.phone,
    is_2fa_enabled: user.is2FaEnabled,
    is_active: user.isActive,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

// ──── Auth Required Response Helper ────
// Returns a standardized 401 response for unauthenticated requests

export function authRequiredResponse() {
  return NextResponse.json(
    {
      success: false,
      dignity_preserved: true,
      message_ar: 'يجب تسجيل الدخول للوصول إلى هذا المورد',
      message_en: 'Authentication required to access this resource',
      code: 'AUTH_REQUIRED',
    },
    { status: 401 }
  );
}
