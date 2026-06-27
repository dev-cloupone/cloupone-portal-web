export type ConsultantPaymentStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';

export interface ConsultantPaymentLine {
  id: string;
  paymentId: string;
  projectId: string;
  projectName: string;
  calculatedHours: string;
  appliedHours: string;
  originalRate: string;
  appliedRate: string;
  subtotal: string;
}

export interface ConsultantPayment {
  id: string;
  userId: string;
  consultantName: string;
  year: number;
  month: number;
  status: ConsultantPaymentStatus;
  totalHours: string;
  totalAmount: string;
  receiptFileId: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  lines?: ConsultantPaymentLine[];
}

export type ExpensePaymentStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';

export interface ExpensePaymentItem {
  id: string;
  expensePaymentId: string;
  expenseId: string;
  amount: string;
  expenseDescription: string | null;
  expenseDate: string;
  projectName: string;
  categoryName: string | null;
}

export interface ExpensePayment {
  id: string;
  userId: string;
  consultantName: string;
  periodStart: string;
  periodEnd: string;
  status: ExpensePaymentStatus;
  totalAmount: string;
  receiptFileId: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  items?: ExpensePaymentItem[];
}

export interface AvailableExpensePeriod {
  projectId: string;
  projectName: string;
  periodId: string;
  weekStart: string;
  weekEnd: string;
  expenseCount: number;
  totalAmount: string;
}

// Fatura de Serviços
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export type InvoiceType = 'hourly' | 'fixed_price';

export type InvoiceLineType = 'hours' | 'custom' | 'installment';

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  lineType: InvoiceLineType;
  consultantId: string | null;
  consultantName: string | null;
  description: string | null;
  calculatedHours: string | null;
  appliedHours: string;
  originalRate: string | null;
  appliedRate: string;
  subtotal: string;
  installmentId?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: number | null;
  clientId: string;
  clientName: string;
  clientCnpj: string | null;
  projectId: string;
  projectName: string;
  year: number;
  month: number;
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  totalHours: string;
  totalAmount: string;
  issuedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  lines?: InvoiceLine[];
}

// Fatura de Despesas
export interface ExpenseInvoiceItem {
  id: string;
  expenseInvoiceId: string;
  expenseId: string;
  description: string | null;
  originalAmount: string;
  appliedAmount: string;
  categoryName: string | null;
  categoryMaxAmount: string | null;
}

export interface ExpenseInvoice {
  id: string;
  invoiceNumber: number | null;
  clientId: string;
  clientName: string;
  clientCnpj: string | null;
  projectId: string;
  projectName: string;
  periodId: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  totalAmount: string;
  issuedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  items?: ExpenseInvoiceItem[];
}
