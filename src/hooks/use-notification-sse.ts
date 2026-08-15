import { useEffect } from 'react';
import { useNotificationStore } from '../stores/notification.store';
import { useNotificationToastStore } from '../stores/notification-toast.store';
import { useAuthStore } from '../stores/auth.store';
import { getAccessToken, BASE_URL } from '../services/api';
import { playNotificationSound } from '../utils/notification-sound';
import type { Notification } from '../types/notification.types';

export function useNotificationSSE() {
  // Depende apenas do id: o objeto `user` muda de identidade a cada refresh de
  // perfil e derrubaria o stream. Estado volatil (DND, preferencias) e lido
  // dentro do handler via getState().
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    const token = getAccessToken();
    if (!userId || !token) return;

    const es = new EventSource(`${BASE_URL}/notifications/stream?token=${token}`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        const notification = data as Notification;
        const { addNotification, enqueueModal, isDndActive } = useNotificationStore.getState();
        const user = useAuthStore.getState().user;

        addNotification(notification);

        // DND silencia tudo: sem modal, sem toast e sem som. A notificacao
        // continua registrada no sino (badge + lista).
        if (isDndActive) return;

        if (user?.notificationSoundEnabled) {
          playNotificationSound();
        }

        if (user?.urgentNotificationsEnabled) {
          enqueueModal(notification);
        } else {
          useNotificationToastStore.getState().push(notification);
        }
      } catch {
        // Ignore invalid messages (heartbeats, etc)
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically
    };

    return () => {
      es.close();
    };
  }, [userId]);
}
