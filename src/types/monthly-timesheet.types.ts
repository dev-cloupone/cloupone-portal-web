export type MonthlyTimesheetStatus = 'open' | 'approved' | 'reopened';

export interface MonthlyTimesheet {
  id: string;
  userId: string;
  year: number;
  month: number;
  status: MonthlyTimesheetStatus;
  approvedAt?: string;
  approvedById?: string;
  reopenedAt?: string;
  reopenedById?: string;
  reopenReason?: string;
  escalatedAt?: string;
  // Join fields
  consultantName?: string;
  totalHours?: number;
}

export interface PendingMonth {
  userId: string;
  year: number;
  month: number;
  status: MonthlyTimesheetStatus;
  reopenReason?: string;
}
