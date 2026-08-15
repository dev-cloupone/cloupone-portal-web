import { useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../stores/notification.store';
import type { Notification } from '../../types/notification.types';

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('notifications.now');
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (n: Notification) => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => onRead(notification)}
      className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-surface-2 ${
        notification.isRead ? 'opacity-60' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-tight ${notification.isRead ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <span className="text-[10px] text-text-muted mt-1 block">{timeAgo(notification.createdAt, t)}</span>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
      )}
    </button>
  );
}

export function NotificationBell({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isDropdownOpen = useNotificationStore((s) => s.isDropdownOpen);
  const toggleDropdown = useNotificationStore((s) => s.toggleDropdown);
  const closeDropdown = useNotificationStore((s) => s.closeDropdown);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  // Close on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isDropdownOpen, closeDropdown]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    closeDropdown();
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`relative flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-3 hover:text-text-secondary transition-colors ${
          unreadCount > 0 ? 'bell-ringing' : ''
        }`}
        title={t('notifications.title')}
      >
        <Bell size={collapsed ? 18 : 16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white animate-badge-pop">
            {badgeText}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className={`absolute z-50 mt-1 w-80 rounded-xl border border-border bg-surface-1 shadow-xl overflow-hidden ${
          collapsed ? 'left-full ml-2 top-0' : 'right-0'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllAsRead()}
                className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 transition-colors"
              >
                <CheckCheck size={14} />
                {t('notifications.markAllAsRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={24} className="mx-auto mb-2 text-text-muted" />
                <p className="text-sm text-text-muted">{t('notifications.empty')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={handleNotificationClick} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
