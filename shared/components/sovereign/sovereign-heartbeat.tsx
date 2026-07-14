'use client';

export function SovereignHeartbeat() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      النظام يعمل بشكل طبيعي
    </div>
  );
}
