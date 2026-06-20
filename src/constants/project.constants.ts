export const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  finished: 'Finalizado',
};

export const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  paused: 'warning',
  finished: 'default',
};

export const BUDGET_TYPE_LABELS: Record<string, string> = {
  monthly: 'mensal',
  total: 'total',
};

export const statusOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'finished', label: 'Finalizado' },
];

export const budgetTypeOptions = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'total', label: 'Total' },
];
