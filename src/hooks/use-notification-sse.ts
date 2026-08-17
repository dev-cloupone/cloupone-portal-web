import { useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '../stores/notification.store';
import { useNotificationToastStore } from '../stores/notification-toast.store';
import { useAuthStore } from '../stores/auth.store';
import { getAccessToken, subscribeAccessToken, tryRefreshToken, BASE_URL } from '../services/api';
import { playNotificationSound } from '../utils/notification-sound';
import type { Notification } from '../types/notification.types';

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

export function useNotificationSSE() {
  // Depende apenas do id: o objeto `user` muda de identidade a cada refresh de
  // perfil e derrubaria o stream. Estado volatil (DND, preferencias) e lido
  // dentro do handler via getState().
  const userId = useAuthStore((s) => s.user?.id);
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  // Muda para forcar a reabertura da conexao apos falha.
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const attemptsRef = useRef(0);

  // Rotacao de token (a cada ~13min) precisa reabrir o stream: a URL carrega o
  // token antigo e o servidor so valida no handshake.
  useEffect(() => subscribeAccessToken(setToken), []);

  useEffect(() => {
    if (!userId || !token) return;

    const es = new EventSource(`${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`);
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    es.onopen = () => {
      attemptsRef.current = 0;
    };

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
      // O browser so reconecta sozinho em queda de transporte. Em resposta HTTP
      // != 200 (token expirado -> 401) ele fecha de vez, e sem isso o sino
      // silencia ate a proxima navegacao.
      if (es.readyState !== EventSource.CLOSED) return;

      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attemptsRef.current, RECONNECT_MAX_MS);
      attemptsRef.current += 1;
      retryTimer = setTimeout(() => {
        void tryRefreshToken().finally(() => {
          setToken(getAccessToken());
          setReconnectNonce((n) => n + 1);
        });
      }, delay);
    };

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      es.close();
    };
  }, [userId, token, reconnectNonce]);
}
