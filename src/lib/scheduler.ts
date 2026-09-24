// ─── Background scheduler: periodic late-return sweep ────────────────
import { runLateCheck } from '@/lib/late-check';

const SWEEP_INTERVAL_MS = 30_000; // every 30s

export function startScheduler() {
  const g = globalThis as unknown as { __rentalSweepTimer?: NodeJS.Timeout };
  if (g.__rentalSweepTimer) return; // avoid duplicate timers in dev hot-reload

  const sweep = async () => {
    try {
      const res = await runLateCheck();
      if (res.checked > 0) {
        console.log(
          `⏱️ [late-check] checked=${res.checked} newOverdue=${res.newlyOverdue} warnings=${res.warningsSent} fees=${res.totalLateFees}`,
        );
      }
    } catch (err) {
      console.error('⏱️ [late-check] failed:', err);
    }
  };

  // first sweep shortly after boot, then on an interval
  setTimeout(sweep, 5_000);
  g.__rentalSweepTimer = setInterval(sweep, SWEEP_INTERVAL_MS);
  console.log('⏱️ [scheduler] late-return sweep started (every 30s)');
}
