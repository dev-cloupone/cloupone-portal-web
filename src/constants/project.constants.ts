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

export const BILLING_TYPE_LABELS: Record<string, string> = {
  hourly: 'Por Hora',
  fixed_price: 'Valor Fixo',
};

export const BILLING_TYPE_VARIANTS: Record<string, 'default' | 'accent'> = {
  hourly: 'default',
  fixed_price: 'accent',
};

export const billingTypeOptions = [
  { value: 'hourly', label: 'Por Hora' },
  { value: 'fixed_price', label: 'Valor Fixo' },
];

export const INSTALLMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  invoiced: 'Faturado',
  paid: 'Pago',
};

export const INSTALLMENT_STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success'> = {
  pending: 'default',
  invoiced: 'warning',
  paid: 'success',
};
