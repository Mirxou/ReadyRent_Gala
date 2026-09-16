// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Startup Checks (P0 fix)
// Validates that critical env vars are set BEFORE the app accepts any request.
// If any required secret is missing, the app fails fast with a clear error
// instead of silently running in a degraded/forgeable state.
// ═══════════════════════════════════════════════════════════════

import { logger } from './logger';

type Severity = 'fatal' | 'warn';

interface CheckResult {
  name: string;
  severity: Severity;
  message: string;
}

const checks: CheckResult[] = [];

function checkEnv(name: string, severity: Severity, description: string): void {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    checks.push({ name, severity, message: `${description} — env var ${name} is missing or empty` });
  }
}

/**
 * Run all critical env-var checks. Returns the list of failures.
 * Fatal failures should cause the app to refuse to start.
 */
export function runStartupChecks(): { fatal: CheckResult[]; warnings: CheckResult[] } {
  checks.length = 0;

  // ─── FATAL: app cannot safely operate without these ───
  checkEnv('NEXTAUTH_SECRET', 'fatal', 'Session token signing key (without it, anyone can forge sessions)');
  checkEnv('DATABASE_URL', 'fatal', 'Prisma database connection string');
  checkEnv('CHARGILY_API_KEY', 'fatal', 'Chargily Pay API key — required for webhook signature verification');

  // ─── WARN: app runs but features are degraded ───
  checkEnv('RESEND_API_KEY', 'warn', 'Resend transactional email service — password reset + welcome emails will be disabled');
  checkEnv('CLOUDINARY_CLOUD_NAME', 'warn', 'Cloudinary cloud name — image uploads will fail');
  checkEnv('CLOUDINARY_API_KEY', 'warn', 'Cloudinary API key — image uploads will fail');
  checkEnv('CLOUDINARY_API_SECRET', 'warn', 'Cloudinary API secret — image uploads will fail');
  checkEnv('NEXT_PUBLIC_APP_URL', 'warn', 'Public app URL — password reset email links will be relative');
  checkEnv('NEXT_PUBLIC_BASE_URL', 'warn', 'Public base URL — sitemap/OG metadata will use fallback');

  const fatal = checks.filter(c => c.severity === 'fatal');
  const warnings = checks.filter(c => c.severity === 'warn');

  // Log warnings but continue
  for (const w of warnings) {
    logger.warn('Startup', w.message);
  }

  // Fatal: log each one, then throw a single aggregate error
  if (fatal.length > 0) {
    for (const f of fatal) {
      logger.error('Startup', f.message);
    }
    throw new Error(
      `[STARTUP CHECK FAILED] ${fatal.length} fatal env var(s) missing:\n` +
      fatal.map(f => `  - ${f.name}: ${f.message}`).join('\n') +
      '\nSet these in your .env file before starting the app.'
    );
  }

  return { fatal, warnings };
}

/**
 * Get the AUTH_SECRET, throwing if it's missing instead of silently using ''.
 * Replaces the dangerous `process.env.NEXTAUTH_SECRET || ''` pattern.
 */
export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error(
      'NEXTAUTH_SECRET is not set. Session token signing is disabled — ' +
      'an attacker can forge any user session. Set NEXTAUTH_SECRET in your .env file.'
    );
  }
  return secret;
}

/**
 * Same as getAuthSecret but returns null instead of throwing.
 * Use this only in code paths that can gracefully degrade (e.g. notifications service).
 */
export function tryGetAuthSecret(): string | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.trim() === '') return null;
  return secret;
}
