import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/notification.store';
import { useAuth } from './use-auth';
import { useToastStore } from '../stores/toast.store';
import { getAccessToken, BASE_URL } from '../services/api';
import type { Notification } from '../types/notification.types';

export function useNotificationSSE() {
  const { user } = useAuth();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const enqueueModal = useNotificationStore((s) => s.enqueueModal);
  const isDndActive = useNotificationStore((s) => s.isDndActive);
  const addToast = useToastStore((s) => s.addToast);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!user || !token) return;

    const es = new EventSource(`${BASE_URL}/notifications/stream?token=${token}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        const notification = data as Notification;
        addNotification(notification);

        // Decide: modal (triage) or toast
        if (user.urgentNotificationsEnabled && !isDndActive) {
          enqueueModal(notification);
        } else {
          addToast(notification.title, 'info');
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
      eventSourceRef.current = null;
    };
  }, [user, addNotification, enqueueModal, isDndActive, addToast]);
}
