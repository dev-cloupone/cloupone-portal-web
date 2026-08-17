export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationPreferences {
  urgentNotificationsEnabled: boolean;
  notificationSoundEnabled: boolean;
}
