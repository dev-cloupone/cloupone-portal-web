import { api } from './api';

export interface NotificationSettingUser {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  eventType: string;
  channelEmail: boolean;
  channelInApp: boolean;
}

export interface NotificationEmail {
  id: string;
  email: string;
  eventType: string;
  createdAt: string;
}

export async function getSettings(projectId: string, eventType = 'ticket_created') {
  return api<{ data: NotificationSettingUser[] }>(
    `/projects/${projectId}/notification-settings?eventType=${eventType}`,
  );
}

export async function upsertSettings(
  projectId: string,
  settings: { userId: string; eventType: string; channelEmail: boolean; channelInApp: boolean }[],
) {
  return api(`/projects/${projectId}/notification-settings`, {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

export async function getEmails(projectId: string) {
  return api<{ data: NotificationEmail[] }>(`/projects/${projectId}/notification-emails`);
}

export async function addEmail(projectId: string, email: string, eventType = 'ticket_created') {
  return api<NotificationEmail>(`/projects/${projectId}/notification-emails`, {
    method: 'POST',
    body: JSON.stringify({ email, eventType }),
  });
}

export async function removeEmail(projectId: string, id: string) {
  return api(`/projects/${projectId}/notification-emails/${id}`, { method: 'DELETE' });
}
