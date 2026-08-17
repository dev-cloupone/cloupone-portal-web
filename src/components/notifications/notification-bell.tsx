import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, CheckCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../stores/notification.store';
import { computeDropdownPosition, type DropdownPosition } from './dropdown-position';
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

export function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (n: Notification) => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={() => onRead(notification)}
      className={`relative w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-surface-2 ${
        notification.isRead ? '' : 'bg-accent/[0.04]'
      }`}
    >
      {!notification.isRead && (
        <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent" />
      )}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
        <FileText size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold leading-tight ${notification.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[12px] text-text-tertiary mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <span className="text-[11px] text-text-muted mt-1 block">{timeAgo(notification.createdAt, t)}</span>
      </div>
    </button>
  );
}

export function NotificationBell({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const instanceId = useId();
  const buttonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const [isRinging, setIsRinging] = useState(false);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isDropdownOpen = useNotificationStore((s) => s.isDropdownOpen);
  const dropdownOwner = useNotificationStore((s) => s.dropdownOwner);
  const isDndActive = useNotificationStore((s) => s.isDndActive);
  const ringToken = useNotificationStore((s) => s.ringToken);
  const toggleDropdown = useNotificationStore((s) => s.toggleDropdown);
  const closeDropdown = useNotificationStore((s) => s.closeDropdown);
  const toggleDnd = useNotificationStore((s) => s.toggleDnd);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  // Varias instancias do sino ficam montadas ao mesmo tempo (sidebar, drawer,
  // topbar); apenas a que abriu o dropdown renderiza o painel.
  const isOpen = isDropdownOpen && dropdownOwner === instanceId;

  const updatePosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition(
      computeDropdownPosition(
        { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    );
  }, []);

  // Posiciona o painel a partir da ancora e reposiciona em resize/scroll
  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    updatePosition();
    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Fecha por clique fora (checa ancora e painel — o painel vive num portal) e por Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeDropdown();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDropdown();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  // Toca a animacao do sino uma vez por notificacao recebida
  useEffect(() => {
    if (ringToken === 0) return;
    setIsRinging(true);
    const timer = setTimeout(() => setIsRinging(false), 600);
    return () => clearTimeout(timer);
  }, [ringToken]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    closeDropdown();
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleViewAll = () => {
    closeDropdown();
    navigate('/notifications');
  };

  const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);

  const panel = isOpen && position && (
    <div
      ref={panelRef}
      style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
      className="fixed z-[60] flex flex-col overflow-hidden rounded-xl border border-border bg-surface-1 shadow-xl animate-dropdown-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{t('notifications.title')}</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 transition-colors"
            >
              <CheckCheck size={14} />
              {t('notifications.markAllAsRead')}
            </button>
          )}
          <button
            onClick={toggleDnd}
            title={isDndActive ? t('notifications.dndOn') : t('notifications.dndOff')}
            aria-label={t('notifications.dnd')}
            aria-pressed={isDndActive}
            className={`flex items-center justify-center rounded-lg p-1.5 transition-colors ${
              isDndActive
                ? 'bg-danger/10 text-danger'
                : 'text-text-muted hover:bg-surface-3 hover:text-text-secondary'
            }`}
          >
            <BellOff size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[400px] flex-1 overflow-y-auto divide-y divide-border">
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

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5 text-center">
        <button
          onClick={handleViewAll}
          className="rounded-lg px-4 py-1.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent/10"
        >
          {t('notifications.viewAll')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => toggleDropdown(instanceId)}
        className={`relative flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-3 hover:text-text-secondary transition-colors ${
          isRinging ? 'bell-ringing' : ''
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

      {panel && createPortal(panel, document.body)}
    </div>
  );
}
