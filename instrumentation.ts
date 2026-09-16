// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Next.js Instrumentation Hook (P2-31 fix)
// Runs ONCE when the Next.js server starts (before any request is served).
// Used to fail fast on missing critical env vars.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
// ═══════════════════════════════════════════════════════════════

export async function register() {
  // Only run on the server (not in the Edge runtime or during build SSG)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runStartupChecks } = await import('./lib/startup-checks');
    try {
      runStartupChecks();
      // eslint-disable-next-line no-console
      console.log('[Startup] All critical env vars present.');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Startup] FATAL:', err);
      // In dev: log the error but keep running so the developer can fix it
      // and reload. In production: exit so the container restarts with the
      // error visible in logs.
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
}
