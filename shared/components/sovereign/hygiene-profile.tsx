'use client';

export function HygieneProfile({ className = '' }: { className?: string }) {
  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      ملف النظافة غير متاح
    </div>
  );
}
