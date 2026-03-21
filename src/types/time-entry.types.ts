export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  clientName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  hours: number | string;
  description?: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  ticketId?: string | null;
  ticketCode?: string | null;
  ticketTitle?: string | null;
  rejectionComment?: string | null;
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

export interface UpsertEntryData {
  id?: string;
  projectId: string;
  categoryId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  ticketId?: string | null;
}
