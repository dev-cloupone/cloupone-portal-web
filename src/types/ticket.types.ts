export type TicketType = 'system_error' | 'question' | 'improvement' | 'security';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_analysis' | 'awaiting_customer' | 'awaiting_third_party' | 'finished';

export interface Ticket {
  id: string;
  code: string;
  projectId: string;
  projectName: string;
  clientName: string;
  createdBy: string;
  createdByName: string;
  assignedTo: string | null;
  assignedToName: string | null;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  isVisibleToClient: boolean;
  dueDate: string | null;
  estimatedHours: number | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileMimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

export interface TicketStats {
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  byType: Record<TicketType, number>;
  unassigned: number;
  myAssigned: number;
  recentlyOpened: number;
}

export interface CreateTicketData {
  projectId: string;
  type: TicketType;
  priority?: TicketPriority;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isVisibleToClient?: boolean;
  assignedTo?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
}

export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string | null;
  isVisibleToClient?: boolean;
  title?: string;
  description?: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
}

export interface ListTicketParams {
  projectId?: string;
  status?: string;
  type?: TicketType;
  priority?: TicketPriority;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
  sort?: 'created_at' | 'updated_at' | 'priority' | 'status';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  system_error: 'Erro de sistema',
  question: 'Dúvida',
  improvement: 'Solicitação de melhoria',
  security: 'Segurança/Acesso',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_analysis: 'Em Analise',
  awaiting_customer: 'Aguardando Retorno do Cliente',
  awaiting_third_party: 'Aguardando Terceiro',
  finished: 'Finalizado',
};
