interface ProgressBarProps {
  estimated: number;
  actual: number;
}

export function ProgressBar({ estimated, actual }: ProgressBarProps) {
  const percentage = estimated > 0 ? (actual / estimated) * 100 : 0;

  let colorClass = 'bg-success';
  if (percentage > 100) colorClass = 'bg-danger';
  else if (percentage > 80) colorClass = 'bg-warning';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>{actual.toFixed(1)}h / {estimated.toFixed(1)}h</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
