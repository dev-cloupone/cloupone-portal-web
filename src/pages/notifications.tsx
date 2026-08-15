import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SidebarLayout } from '../components/ui/sidebar-layout';
import { PaginationControls } from '../components/ui/pagination-controls';
import { Skeleton } from '../components/ui/skeleton';
import { NotificationItem } from '../components/notifications/notification-bell';
import { useNavItems } from '../hooks/use-nav-items';
import { useNotificationStore } from '../stores/notification.store';
import * as notificationService from '../services/notification.service';
import { formatApiError } from '../services/api';
import type { Notification } from '../types/notification.types';
import type { PaginationMeta } from '../types/pagination.types';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const navItems = useNavItems();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await notificationService.listNotifications({ page, limit: PAGE_SIZE });
      setNotifications(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      // Store compartilhado: mantem badge e lista do sino sincronizados
      await markAsRead(notification.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    await loadData(meta.page);
    await fetchUnreadCount().catch(() => {});
  };

  return (
    <SidebarLayout navItems={navItems} title={t('notifications.title')}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-heading text-text-primary">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <button
              onClick={() => void handleMarkAllAsRead()}
              className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
            >
              <CheckCheck size={15} />
              {t('notifications.markAllAsRead')}
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell size={28} className="mx-auto mb-2 text-text-muted" />
              <p className="text-sm text-text-muted">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={handleNotificationClick} />
              ))}
            </div>
          )}
        </div>

        <PaginationControls meta={meta} onPageChange={(page) => void loadData(page)} />
      </div>
    </SidebarLayout>
  );
}
