// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Background Scheduler (GRAFT: كراء بلا همّ P0)
// Started once from instrumentation.ts register(). Sweeps late
// returns every 30s. Guards against double-start (dev hot reload)
// and against running inside the production build phase.
// ═══════════════════════════════════════════════════════════════

const SWEEP_INTERVAL_MS = 30_000;

interface SchedulerGlobal {
  __trustEngineSweepTimer?: ReturnType<typeof setInterval>;
}

const g = globalThis as typeof globalThis & SchedulerGlobal;

export function startScheduler(): void {
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (g.__trustEngineSweepTimer) return; // already running

  g.__trustEngineSweepTimer = setInterval(async () => {
    try {
      const { runLateCheck } = await import('./late-check');
      const summary = await runLateCheck();
      if (summary.newlyOverdue || summary.warningsSent || summary.errors) {
        // eslint-disable-next-line no-console
        console.log(
          `[late-sweep] overdue=${summary.newlyOverdue} accrued=${summary.accrued} ` +
            `warnings=${summary.warningsSent} errors=${summary.errors}`
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[late-sweep] failed:', err);
    }
  }, SWEEP_INTERVAL_MS);

  // eslint-disable-next-line no-console
  console.log('[scheduler] trust-engine late sweep started (every 30s)');
}

export function stopScheduler(): void {
  if (g.__trustEngineSweepTimer) {
    clearInterval(g.__trustEngineSweepTimer);
    g.__trustEngineSweepTimer = undefined;
  }
}
