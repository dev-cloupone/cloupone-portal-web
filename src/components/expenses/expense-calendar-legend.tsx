import { useTranslation } from 'react-i18next';

export function ExpenseCalendarLegend() {
  const { t } = useTranslation();
  const items = [
    { color: 'bg-success-15', border: 'border-success/30', label: t('expenses.weekOpenLegend') },
    { color: 'bg-surface-2', border: 'border-border', label: t('expenses.weekClosedLegend') },
    { color: 'bg-success', border: '', label: t('expenses.legendApproved'), dot: true },
    { color: 'bg-accent', border: '', label: t('expenses.legendCreated'), dot: true },
    { color: 'bg-text-muted', border: '', label: t('expenses.legendDraft'), dot: true },
    { color: 'bg-warning', border: '', label: t('expenses.legendSubmitted'), dot: true },
    { color: 'bg-danger', border: '', label: t('expenses.legendRejected'), dot: true },
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
