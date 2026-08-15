import { FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useNotificationToastStore, type NotificationToast } from '../../stores/notification-toast.store';
import { useNotificationStore } from '../../stores/notification.store';

function NotificationToastCard({ toast }: { toast: NotificationToast }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dismiss = useNotificationToastStore((s) => s.dismiss);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  const { notification } = toast;
  const metadata = notification.metadata as Record<string, string> | null;
  const details =
    [metadata?.ticketCode, metadata?.projectName].filter(Boolean).join(' — ') || notification.body;

  const handleView = async () => {
    dismiss(toast.id);
    if (!notification.isRead) {
      await markAsRead(notification.id).catch(() => {});
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div
      className={`pointer-events-auto relative w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface-2 px-4 py-3.5 shadow-lg ${
        toast.exiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <FileText size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
            {t('notifications.newNotification')}
          </p>
          <p className="truncate text-[13px] font-semibold text-text-primary">{notification.title}</p>
          {details && <p className="truncate text-[12px] text-text-tertiary">{details}</p>}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 self-center">
          <button
            onClick={() => void handleView()}
            className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            {t('notifications.view')}
          </button>
          <button
            onClick={() => dismiss(toast.id)}
            aria-label={t('common.close')}
            className="flex items-center justify-center rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-secondary"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!toast.exiting && (
        <span className="animate-toast-progress absolute bottom-0 left-0 h-0.5 bg-accent/50" />
      )}
    </div>
  );
}

export function NotificationToastContainer() {
  const toasts = useNotificationToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[70] flex flex-col gap-2">
      {toasts.map((toast) => (
        <NotificationToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
