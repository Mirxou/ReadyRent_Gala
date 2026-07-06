// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Server-Side Auth Utilities
// In-memory session store with cookie-based authentication
// ═══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { db } from './db';

// ──── In-Memory Session Store ────
const sessions = new Map<string, { userId: string; expiresAt: number }>();

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateSessionToken(): string {
  return `sess_${crypto.randomUUID().replace(/-/g, '')}`;
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_DURATION });
  return token;
}

export function validateSession(token: string): { userId: string } | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return { userId: session.userId };
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function getSessionFromRequest(request: Request): { userId: string; token: string } | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const session = validateSession(token);
    if (session) return { ...session, token };
  }

  // Check cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/session_token=([^;]+)/);
  if (match) {
    const token = match[1];
    const session = validateSession(token);
    if (session) return { ...session, token };
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