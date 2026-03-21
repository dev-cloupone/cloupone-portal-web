export interface ClientReportEntry {
  date: string;
  consultantName: string | null;
  activityName: string | null;
  description: string | null;
  hours: string;
  projectName: string;
  billingRate: string;
}

export interface ProjectSummary {
  projectName: string;
  hours: number;
  rate: number;
  value: number;
}

export interface ClientReportData {
  client: {
    id: string;
    companyName: string;
    cnpj: string | null;
  };
  entries: ClientReportEntry[];
  totalHours: number;
  totalValue: number;
  projectSummary: ProjectSummary[];
}

// --- Consultant Report Types ---

export interface ConsultantReportEntry {
  date: string;
  projectName: string;
  billingRate: string;
  activityName: string | null;
  isBillable: boolean;
  ticketCode: string | null;
  ticketTitle: string | null;
  ticketType: string | null;
  hours: string;
  description: string | null;
}

export interface ConsultantTicketSummary {
  ticketCode: string;
  ticketTitle: string;
  ticketType: string;
  estimatedHours: number | null;
  actualHours: number;
}

export interface ConsultantProjectSummary {
  projectName: string;
  billingRate: number;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalValue: number;
  tickets: ConsultantTicketSummary[];
}

export interface ConsultantReportData {
  consultant: {
    id: string;
    name: string;
    email: string;
    contractType: string;
    hourlyRate: string;
  };
  entries: ConsultantReportEntry[];
  projectSummary: ConsultantProjectSummary[];
  totalHours: number;
  totalBillableHours: number;
  totalNonBillableHours: number;
  totalValue: number;
}

// --- Enhanced Client Report Types ---

export interface EnhancedClientTicket {
  code: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  estimatedHours: number | null;
  actualHours: number;
}

export interface EnhancedClientProjectSummary {
  projectName: string;
  billingRate: number;
  budgetHours: number | null;
  totalHours: number;
  totalValue: number;
  tickets: EnhancedClientTicket[];
}

export interface EnhancedClientEntry {
  date: string;
  consultantName: string | null;
  ticketCode: string | null;
  activityName: string | null;
  description: string | null;
  hours: string;
  projectName: string;
  billingRate: string;
}

export interface TicketStatusSummary {
  open: number;
  in_analysis: number;
  in_progress: number;
  in_review: number;
  resolved: number;
  closed: number;
  reopened: number;
  cancelled: number;
}

export interface TicketTypeSummary {
  bug: number;
  improvement: number;
  initiative: number;
}

export interface EnhancedClientReportData {
  client: { id: string; companyName: string; cnpj: string | null };
  entries: EnhancedClientEntry[];
  projectSummary: EnhancedClientProjectSummary[];
  ticketStatusSummary: TicketStatusSummary;
  ticketTypeSummary: TicketTypeSummary;
  totalTickets: number;
  totalHours: number;
  totalValue: number;
}
