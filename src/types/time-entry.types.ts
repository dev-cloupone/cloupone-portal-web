export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  clientName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  hours: number | string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  ticketId?: string | null;
  ticketCode?: string | null;
  ticketTitle?: string | null;
  subphaseId?: string | null;
}

export interface WeekData {
  weekStartDate: string;
  entries: TimeEntry[];
  totalHours: number;
  targetHours: number;
}

export interface DayGroup {
  date: string;
  dayLabel: string;
  dateFormatted: string;
  entries: TimeEntry[];
  totalHours: number;
}

export interface MonthData {
  month: string;
  entries: TimeEntry[];
  totalHours: number;
  targetHours: number;
  workingDays: number;
  monthlyTimesheet: {
    id: string;
    status: 'open' | 'approved' | 'reopened';
    approvedAt?: string | null;
    reopenReason?: string | null;
  };
}

export interface WeekSummary {
  weekStartDate: string;
  entries: TimeEntry[];
  totalHours: number;
  targetHours: number;
}

export interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  entries: TimeEntry[];
  totalHours: number;
}

export interface UpsertEntryData {
  id?: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  ticketId?: string | null;
  subphaseId?: string | null;
}

// --- List view types ---

export interface TimeEntryListItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: string;
  description: string | null;
  consultantId: string;
  consultantName: string;
  projectId: string;
  projectName: string;
  subphaseId: string | null;
  subphaseName: string | null;
  ticketId: string | null;
  ticketCode: string | null;
  ticketTitle: string | null;
}

export interface TimeEntryListResponse {
  entries: TimeEntryListItem[];
  totalHours: string;
}

export interface TimeEntryListParams {
  month: string;
  consultantId?: string;
  projectId?: string;
  subphaseId?: string;
  ticketId?: string;
  all?: boolean;
}

export interface ConsultantOption {
  id: string;
  name: string;
}
