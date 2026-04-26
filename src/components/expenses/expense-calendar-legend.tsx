export function ExpenseCalendarLegend() {
  const items = [
    { color: 'bg-accent-10', border: 'border-accent/30', label: 'Semana aberta' },
    { color: 'bg-surface-2', border: 'border-border', label: 'Semana fechada' },
    { color: 'bg-success', border: '', label: 'Aprovada', dot: true },
    { color: 'bg-accent', border: '', label: 'Criada', dot: true },
    { color: 'bg-text-muted', border: '', label: 'Rascunho', dot: true },
    { color: 'bg-warning', border: '', label: 'Submetida', dot: true },
    { color: 'bg-danger', border: '', label: 'Rejeitada', dot: true },
  ];

  return (
    <div className="flex flex-wrap gap-3 text-xs text-text-tertiary">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {item.dot ? (
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
          ) : (
            <span className={`w-4 h-3 rounded border ${item.color} ${item.border}`} />
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
