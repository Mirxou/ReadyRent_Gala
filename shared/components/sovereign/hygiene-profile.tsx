'use client';

// `record` is accepted for API compatibility with the product detail page
// (which forwards the latest hygiene record); the profile body is static.
export function HygieneProfile({ className = '', record: _record }: { className?: string; record?: unknown }) {
  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      ملف النظافة غير متاح
    </div>
  );
}
