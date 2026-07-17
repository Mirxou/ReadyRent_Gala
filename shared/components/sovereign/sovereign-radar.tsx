'use client';

interface RadarPoint {
  label: string;
  value: number;
  maxValue?: number;
}

interface SovereignRadarProps {
  points?: RadarPoint[];
  className?: string;
}

export function SovereignRadar({ points = [], className = '' }: SovereignRadarProps) {
  if (!points || points.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 text-muted-foreground text-sm ${className}`}>
        لا توجد بيانات
      </div>
    );
  }

  const maxVal = Math.max(...points.map(p => p.maxValue || p.value), 1);

  return (
    <div className={`space-y-2 ${className}`}>
      {points.map((point, i) => {
        const pct = Math.min((point.value / maxVal) * 100, 100);
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-24 text-left truncate">{point.label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-sovereign-gold rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium w-10 text-left">{point.value}</span>
          </div>
        );
      })}
    </div>
  );
}