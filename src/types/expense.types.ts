export interface ExpenseCategoryTemplate {
  id: string;
  name: string;
  description: string | null;
  defaultMaxAmount: string | null;
  defaultKmRate: string | null;
  requiresReceipt: boolean;
  isKmCategory: boolean;
  isActive: boolean;
}

/** @deprecated Use ExpenseCategoryTemplate for global templates or ProjectExpenseCategory for project-level */
export type ExpenseCategory = ExpenseCategoryTemplate;

export interface ProjectExpenseCategory {
  id: string;
  projectId: string;
  templateId: string | null;
  name: string;
  maxAmount: string | null;
  kmRate: string | null;
  requiresReceipt: boolean;
  isKmCategory: boolean;
  isActive: boolean;
}

export interface ProjectExpensePeriod {
  id: string;
  projectId: string;
  weekStart: string;
  weekEnd: string;
  customDays: string[] | null;
  status: 'open' | 'closed';
  openedBy: string;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  reopenedBy: string | null;
  reopenedAt: string | null;
}

export interface Expense {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string | null;
  createdByUserId: string;
  createdByName: string;
  consultantUserId: string | null;
  consultantName: string | null;
  expenseCategoryId: string | null;
  categoryName: string | null;
  categoryMaxAmount: string | null;
  categoryRequiresReceipt: boolean | null;
  date: string;
  description: string | null;
  amount: string;
  kmQuantity: string | null;
  clientChargeAmount: string;
  clientChargeAmountManuallySet: boolean;
  receiptFileId: string | null;
  receiptUrl: string | null;
  requiresReimbursement: boolean;
  status: 'created' | 'draft' | 'submitted' | 'approved' | 'rejected';
  autoApproved: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  reimbursedAt: string | null;
  reimbursedBy: string | null;
  revertedBy: string | null;
  revertedAt: string | null;
  revertedByName?: string | null;
  templateId: string | null;
  rejectionComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  expenses: Expense[];
  totalAmount: number;
  periodStatus: 'open' | 'closed' | 'none';
}

export interface ExpenseWeekSummary {
  weekStart: string;
  weekEnd: string;
  totalAmount: number;
  expenseCount: number;
  statusBreakdown: { created: number; draft: number; submitted: number; approved: number; rejected: number };
  hasCreatedExpenses: boolean;
  status: 'empty' | 'created' | 'draft' | 'submitted' | 'approved' | 'mixed';
}

export interface ExpenseMonthData {
  year: number;
  month: number;
  expenses: Expense[];
  totalAmount: number;
}

export interface UpsertExpenseData {
  id?: string;
  projectId: string;
  consultantUserId?: string | null;
  expenseCategoryId?: string | null;
  date: string;
  description?: string | null;
  amount: string;
  kmQuantity?: string | null;
  clientChargeAmount?: string | null;
  receiptFileId?: string | null;
  requiresReimbursement?: boolean;
  templateId?: string | null;
}

export interface PendingExpenseGroup {
  key: string;
  userId: string;
  userName: string;
  userEmail: string;
  weekStart: string;
  weekEnd: string;
  expenses: PendingExpense[];
  totalAmount: number;
}

export type PendingExpense = Expense & { createdByName: string; createdByEmail: string };

export interface ReimbursementListResponse {
  data: PendingExpense[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  totalPending: number;
  totalPaid: number;
}

export interface WeeklyExpenseReportEntry {
  date: string;
  consultantName: string | null;
  categoryName: string | null;
  categoryMaxAmount: string | null;
  description: string | null;
  amount: string;
  clientChargeAmount: string;
  kmQuantity: string | null;
  requiresReimbursement: boolean;
  reimbursedAt: string | null;
  status: string;
}

export interface WeeklyExpenseReportConsultant {
  consultantName: string;
  expenseCount: number;
  totalAmount: number;
  totalClientCharge: number;
  totalReimbursable: number;
  expenses: WeeklyExpenseReportEntry[];
}

export interface WeeklyExpenseReportCategory {
  categoryName: string;
  maxAmount: string | null;
  totalAmount: number;
  totalClientCharge: number;
  percentUsed: number | null;
}

export interface WeeklyExpenseReport {
  project: { id: string; name: string; clientName: string | null };
  period: { weekStart: string; weekEnd: string; status: string };
  byConsultant: WeeklyExpenseReportConsultant[];
  byCategory: WeeklyExpenseReportCategory[];
  totals: {
    totalAmount: number;
    totalClientCharge: number;
    totalReimbursable: number;
    totalReimbursed: number;
    expenseCount: number;
  };
}

export interface ReimbursementFilters {
  page?: number;
  limit?: number;
  consultantId?: string;
  projectId?: string;
  from?: string;
  to?: string;
  reimbursementStatus?: 'pending' | 'paid';
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  expenseCategoryId: string | null;
  categoryName: string | null;
  description: string | null;
  amount: string | null;
  requiresReimbursement: boolean;
}

export interface CreateExpenseTemplateData {
  name: string;
  expenseCategoryId?: string | null;
  description?: string;
  amount?: string;
  requiresReimbursement?: boolean;
}
