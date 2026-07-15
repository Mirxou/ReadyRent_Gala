'use client';

export function SovereignRadar({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <p className="text-muted-foreground text-sm">الرادار التحليلي غير متاح حالياً</p>
    </div>
  );
}
