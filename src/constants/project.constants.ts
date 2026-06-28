export const STATUS_LABELS: Record<string, string> = {
  active: 'projects.statusActive',
  paused: 'projects.statusPaused',
  finished: 'projects.statusFinished',
};

export const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  paused: 'warning',
  finished: 'default',
};

export const BUDGET_TYPE_LABELS: Record<string, string> = {
  monthly: 'projects.budgetMonthlyLower',
  total: 'projects.budgetTotalLower',
};

export function getStatusOptions() {
  return [
    { value: 'active', label: 'projects.statusActive' },
    { value: 'paused', label: 'projects.statusPaused' },
    { value: 'finished', label: 'projects.statusFinished' },
  ];
}

export function getBudgetTypeOptions() {
  return [
    { value: 'monthly', label: 'projects.budgetMonthly' },
    { value: 'total', label: 'projects.budgetTotal' },
  ];
}

export const BILLING_TYPE_LABELS: Record<string, string> = {
  hourly: 'projects.billingHourly',
  fixed_price: 'projects.billingFixed',
};

export const BILLING_TYPE_VARIANTS: Record<string, 'default' | 'accent'> = {
  hourly: 'default',
  fixed_price: 'accent',
};

export function getBillingTypeOptions() {
  return [
    { value: 'hourly', label: 'projects.billingHourly' },
    { value: 'fixed_price', label: 'projects.billingFixed' },
  ];
}

export const INSTALLMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'projects.installmentPending',
  invoiced: 'projects.installmentInvoiced',
  paid: 'projects.installmentPaid',
};

export const INSTALLMENT_STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success'> = {
  pending: 'default',
  invoiced: 'warning',
  paid: 'success',
};
