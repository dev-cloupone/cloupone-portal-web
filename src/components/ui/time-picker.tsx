interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
}

function roundToFiveMinutes(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const rounded = Math.round(m / 5) * 5;
  const finalH = rounded === 60 ? h + 1 : h;
  const finalM = rounded === 60 ? 0 : rounded;
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
}

export function TimePicker({ value, onChange, disabled, label, error }: TimePickerProps) {
  function handleBlur() {
    if (value) {
      onChange(roundToFiveMinutes(value));
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          {label}
        </label>
      )}
      <input
        type="time"
        step={300}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        className={`block w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''}`}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
