export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  maxAmount: string | null;
  requiresReceipt: boolean;
  sortOrder: number;
  isActive: boolean;
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
  description: string;
  amount: string;
  receiptFileId: string | null;
  receiptUrl: string | null;
  requiresReimbursement: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  autoApproved: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  reimbursedAt: string | null;
  reimbursedBy: string | null;
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
}

export interface ExpenseWeekSummary {
  weekStart: string;
  weekEnd: string;
  totalAmount: number;
  expenseCount: number;
  statusBreakdown: { draft: number; submitted: number; approved: number; rejected: number };
  hasDraftExpenses: boolean;
  status: 'empty' | 'draft' | 'submitted' | 'approved' | 'mixed';
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
  description: string;
  amount: string;
  receiptFileId?: string | null;
  requiresReimbursement?: boolean;
  templateId?: string | null;
}

export interface SubmitWeekResult {
  submitted: number;
  autoApproved: number;
  pendingApproval: number;
  warnings: string[];
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
