// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Minimal Logger
// Replaces console.error/console.warn/console.log in production
// ═══════════════════════════════════════════════════════════════

const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const MIN_LEVEL = isDev ? 'debug' : 'error';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL as LogLevel];
}

function formatMessage(level: LogLevel, context: string, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${prefix} ${message}${metaStr}`;
}

export const logger = {
  error(context: string, message: string, meta?: unknown) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', context, message, meta));
    }
  },

  warn(context: string, message: string, meta?: unknown) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', context, message, meta));
    }
  },

  info(context: string, message: string, meta?: unknown) {
    if (shouldLog('info')) {
      console.warn(formatMessage('info', context, message, meta));
    }
  },

  debug(context: string, message: string, meta?: unknown) {
    if (shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.log(formatMessage('debug', context, message, meta));
    }
  },

  /**
   * Audit log — persists an action to the ActivityLog table if available,
   * otherwise falls back to console.log.
   */
  async auditLog(action: string, userId: string, details?: Record<string, unknown>) {
    try {
      const { db } = await import('@/lib/db');
      await db.activityLog.create({
        data: { action, userId, details: details ? JSON.stringify(details) : null },
      });
    } catch {
      // ActivityLog table may not exist yet — fallback to console
      console.warn(formatMessage('info', 'audit', `${action} by ${userId}`, details));
    }
  },
};
