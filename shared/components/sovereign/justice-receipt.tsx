'use client';

export function JusticeReceipt({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-dashed border-white/10 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}
