export const INVOICE_STATUS_MAP: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string }> = {
  draft: { variant: 'default', label: 'invoices.statusDraft' },
  issued: { variant: 'warning', label: 'invoices.statusIssued' },
  paid: { variant: 'success', label: 'invoices.statusPaid' },
  cancelled: { variant: 'danger', label: 'invoices.statusCancelled' },
};
