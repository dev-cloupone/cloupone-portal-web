import { create } from 'zustand';
import type { Notification } from '../types/notification.types';

export interface NotificationToast {
  id: string;
  notification: Notification;
  exiting?: boolean;
}

interface NotificationToastStore {
  toasts: NotificationToast[];
  push: (notification: Notification) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const MAX_TOASTS = 3;
export const TOAST_TTL = 8000;
export const TOAST_EXIT_DURATION = 300;

/** Timers ativos por toast (auto-dismiss ou remocao pos-animacao de saida). */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function clearTimer(id: string): void {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

let sequence = 0;

export const useNotificationToastStore = create<NotificationToastStore>((set, get) => ({
  toasts: [],

  push: (notification) => {
    sequence += 1;
    const id = `notification-toast-${sequence}`;

    set((s) => {
      const next = [...s.toasts, { id, notification }];
      while (next.length > MAX_TOASTS) {
        const removed = next.shift();
        if (removed) clearTimer(removed.id);
      }
      return { toasts: next };
    });

    timers.set(id, setTimeout(() => get().dismiss(id), TOAST_TTL));
  },

  dismiss: (id) => {
    const toast = get().toasts.find((item) => item.id === id);
    if (!toast || toast.exiting) return;

    clearTimer(id);
    set((s) => ({
      toasts: s.toasts.map((item) => (item.id === id ? { ...item, exiting: true } : item)),
    }));

    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        set((s) => ({ toasts: s.toasts.filter((item) => item.id !== id) }));
      }, TOAST_EXIT_DURATION),
    );
  },

  clear: () => {
    for (const id of [...timers.keys()]) clearTimer(id);
    set({ toasts: [] });
  },
}));
