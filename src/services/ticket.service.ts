import { api } from './api';
import { uploadFile } from './uploads';
import type { Ticket, TicketComment, TicketHistoryEntry, TicketAttachment, TicketStats, CreateTicketData, UpdateTicketData, ListTicketParams } from '../types/ticket.types';
import type { PaginatedResponse } from '../types/pagination.types';

export const ticketService = {
  create(data: CreateTicketData): Promise<Ticket> {
    return api('/tickets', { method: 'POST', body: JSON.stringify(data) });
  },

  list(params?: ListTicketParams): Promise<PaginatedResponse<Ticket>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, String(value));
        }
      });
    }
    const qs = query.toString();
    return api(`/tickets${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Ticket> {
    return api(`/tickets/${id}`);
  },

  update(id: string, data: UpdateTicketData): Promise<Ticket> {
    return api(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },

  addComment(ticketId: string, data: { content: string; isInternal?: boolean }): Promise<TicketComment> {
    return api(`/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify(data) });
  },

  listComments(ticketId: string): Promise<TicketComment[]> {
    return api(`/tickets/${ticketId}/comments`);
  },

  listHistory(ticketId: string): Promise<TicketHistoryEntry[]> {
    return api(`/tickets/${ticketId}/history`);
  },

  async addAttachment(ticketId: string, file: File): Promise<TicketAttachment> {
    const uploaded = await uploadFile(file);
    return api(`/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: JSON.stringify({ fileId: uploaded.id }),
    });
  },

  listAttachments(ticketId: string): Promise<TicketAttachment[]> {
    return api(`/tickets/${ticketId}/attachments`);
  },

  removeAttachment(ticketId: string, attachmentId: string): Promise<void> {
    return api(`/tickets/${ticketId}/attachments/${attachmentId}`, { method: 'DELETE' });
  },

  listTimeEntries(ticketId: string): Promise<unknown[]> {
    return api(`/tickets/${ticketId}/time-entries`);
  },

  getStats(projectId?: string): Promise<TicketStats> {
    const qs = projectId ? `?projectId=${projectId}` : '';
    return api(`/tickets/stats${qs}`);
  },
};
