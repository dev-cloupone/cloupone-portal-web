// --- Report System ---

export interface Report {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface ReportPermissionUser {
  id: string;
  name: string;
  email: string;
  hasAccess: boolean;
}

export interface ExpenseReportConsultantGroup {
  consultantId: string;
  consultantName: string;
  entries: {
    date: string;
    category: string;
    description: string;
    amount: number;
    consultantName: string;
  }[];
  subtotal: number;
}

export interface ExpenseReportWeekGroup {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  consultants: ExpenseReportConsultantGroup[];
  weekTotal: number;
}

export interface ExpenseReportResult {
  project: { id: string; name: string; clientName: string };
  view: 'client' | 'consultant';
  weeks: ExpenseReportWeekGroup[];
  grandTotal: number;
}
