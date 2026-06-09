export const INVOICE_STATUS_MAP: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string }> = {
  draft: { variant: 'default', label: 'Rascunho' },
  issued: { variant: 'warning', label: 'Emitida' },
  paid: { variant: 'success', label: 'Paga' },
  cancelled: { variant: 'danger', label: 'Cancelada' },
};
