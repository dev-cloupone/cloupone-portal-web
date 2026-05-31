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
