import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { useNotificationStore } from '../../stores/notification.store';

export function NotificationModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isModalOpen = useNotificationStore((s) => s.isModalOpen);
  const modalQueue = useNotificationStore((s) => s.modalQueue);
  const dismissModal = useNotificationStore((s) => s.dismissModal);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  const currentNotification = modalQueue[0];
  const remaining = modalQueue.length - 1;

  // Blink tab title when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const originalTitle = document.title;
    let visible = true;
    const interval = setInterval(() => {
      document.title = visible ? `🔔 ${t('notifications.actionRequired')}` : originalTitle;
      visible = !visible;
    }, 1000);
    return () => {
      clearInterval(interval);
      document.title = originalTitle;
    };
  }, [isModalOpen, t]);

  if (!isModalOpen || !currentNotification) return null;

  const metadata = currentNotification.metadata as Record<string, string> | null;

  const handleGoToTicket = async () => {
    await markAsRead(currentNotification.id);
    dismissModal();
    if (currentNotification.link) {
      navigate(currentNotification.link);
    }
  };

  const handleViewLater = () => {
    dismissModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop - NOT closable */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-border bg-surface-1 shadow-2xl animate-modal-enter">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">{t('notifications.newTicketTriage')}</h2>
            <p className="text-[11px] text-text-muted">{t('notifications.actionRequired')}</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-2">
            {metadata?.ticketCode && (
              <span className="inline-block rounded bg-accent/10 px-2 py-0.5 text-[11px] font-mono font-medium text-accent">
                {metadata.ticketCode}
              </span>
            )}
            <p className="text-sm font-medium text-text-primary">{currentNotification.title}</p>
            {currentNotification.body && (
              <p className="text-[12px] text-text-secondary leading-relaxed">{currentNotification.body}</p>
            )}
            {metadata?.projectName && (
              <p className="text-[11px] text-text-muted">{metadata.projectName}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6">
          <div>
            {remaining > 0 && (
              <span className="text-[11px] text-text-muted">
                + {remaining} {t('notifications.ticketsWaiting')}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleViewLater}>
              {t('notifications.viewLater')}
            </Button>
            <Button size="sm" onClick={() => void handleGoToTicket()}>
              {t('notifications.goToTicket')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
