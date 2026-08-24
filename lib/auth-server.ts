// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Server-Side Auth Utilities
// Signed session tokens using NEXTAUTH_SECRET (HMAC-SHA256)
// Sessions stored in-memory (production: migrate to DB/Redis)
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

// ──── In-Memory Session Store ────
// CRITICAL: Production should use database-backed sessions.
// This Map is lost on restart and not shared across instances.
const sessions = new Map<string, { userId: string; expiresAt: number }>();

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

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

function verifyToken(signedToken: string): string | null {
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
  // Extract raw token for the store key
  const rawToken = verifyToken(signedToken)!;
  sessions.set(rawToken, { userId, expiresAt: Date.now() + SESSION_DURATION });
  return signedToken;
}

export function validateSession(signedToken: string): { userId: string } | null {
  const rawToken = verifyToken(signedToken);
  if (!rawToken) return null;

  const session = sessions.get(rawToken);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(rawToken);
    return null;
  }
  return { userId: session.userId };
}

export function destroySession(signedToken: string): void {
  const rawToken = verifyToken(signedToken);
  if (rawToken) sessions.delete(rawToken);
}

export function getSessionFromRequest(request: Request): { userId: string; token: string } | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const signedToken = authHeader.slice(7);
    const session = validateSession(signedToken);
    if (session) return { ...session, token: signedToken };
  }

  // Check cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  if (match) {
    const signedToken = match[1];
    const session = validateSession(signedToken);
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
