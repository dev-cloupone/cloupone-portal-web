import { api } from './api';
import type { Notification } from '../types/notification.types';

interface PaginatedNotifications {
  data: Notification[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function listNotifications(params?: { page?: number; limit?: number }): Promise<PaginatedNotifications> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api<PaginatedNotifications>(`/notifications${qs ? `?${qs}` : ''}`);
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return api<{ count: number }>('/notifications/unread-count');
}

export async function markAsRead(id: string): Promise<void> {
  await api(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllAsRead(): Promise<void> {
  await api('/notifications/read-all', { method: 'PATCH' });
}

export async function updateNotificationPreferences(
  data: { urgentNotificationsEnabled?: boolean; notificationSoundEnabled?: boolean },
): Promise<void> {
  await api('/auth/me/notification-preferences', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
