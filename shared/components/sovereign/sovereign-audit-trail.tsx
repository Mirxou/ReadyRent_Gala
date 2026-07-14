'use client';

export function SovereignAuditTrail({ className = '' }: { className?: string }) {
  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <p>سجل التدقيق غير متاح حالياً</p>
    </div>
  );
}
