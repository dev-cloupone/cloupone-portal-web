import { useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationStore } from '../../stores/notification.store';
import { useNotificationSSE } from '../../hooks/use-notification-sse';
import { NotificationModal } from './notification-modal';
import { NotificationToastContainer } from './notification-toast';

/**
 * Ponto unico de montagem do canal de notificacoes. Montado no App, fora de
 * <Routes>: dentro do layout, cada troca de rota derrubava o EventSource e
 * refazia os fetches iniciais, perdendo toast/modal na janela de reconexao.
 */
export function NotificationProvider() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useNotificationSSE();

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount().catch(() => {});
    fetchNotifications().catch(() => {});
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  if (!isAuthenticated) return null;

  return (
    <>
      <NotificationModal />
      <NotificationToastContainer />
    </>
  );
}
