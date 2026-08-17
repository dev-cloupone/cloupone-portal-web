import { create } from 'zustand';
import type { Notification } from '../types/notification.types';
import * as notificationService from '../services/notification.service';

/** Quantidade de notificacoes exibidas no dropdown do sino. */
export const DROPDOWN_LIMIT = 10;

const DND_STORAGE_KEY = 'cloupone:notifications:dnd';

function readStoredDnd(): boolean {
  try {
    return localStorage.getItem(DND_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistDnd(value: boolean): void {
  try {
    localStorage.setItem(DND_STORAGE_KEY, String(value));
  } catch {
    // Ignora storage indisponivel (modo privado, quota)
  }
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isDropdownOpen: boolean;
  /** Identifica qual instancia do sino abriu o dropdown (varias sao montadas ao mesmo tempo). */
  dropdownOwner: string | null;
  isDndActive: boolean;
  /** Incrementa a cada notificacao recebida — dispara a animacao do sino uma unica vez. */
  ringToken: number;
  modalQueue: Notification[];
  isModalOpen: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  toggleDropdown: (owner?: string) => void;
  closeDropdown: () => void;
  toggleDnd: () => void;
  enqueueModal: (notification: Notification) => void;
  dismissModal: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isDropdownOpen: false,
  dropdownOwner: null,
  isDndActive: readStoredDnd(),
  ringToken: 0,
  modalQueue: [],
  isModalOpen: false,

  fetchNotifications: async () => {
    const { data } = await notificationService.listNotifications({ limit: DROPDOWN_LIMIT });
    set({ notifications: data });
  },

  fetchUnreadCount: async () => {
    const { count } = await notificationService.getUnreadCount();
    set({ unreadCount: count });
  },

  markAsRead: async (id) => {
    // Guarda no store, o unico ponto que nenhum chamador consegue esquecer:
    // sem isso, marcar a mesma notificacao duas vezes subestima o badge.
    const target = get().notifications.find(n => n.id === id);
    if (target?.isRead) return;

    await notificationService.markAsRead(id);
    set((s) => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    set((s) => ({
      notifications: s.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (notification) => {
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, DROPDOWN_LIMIT),
      unreadCount: s.unreadCount + 1,
      ringToken: s.ringToken + 1,
    }));
  },

  toggleDropdown: (owner) => set((s) => {
    const nextOwner = owner ?? null;
    if (s.isDropdownOpen && s.dropdownOwner === nextOwner) {
      return { isDropdownOpen: false, dropdownOwner: null };
    }
    return { isDropdownOpen: true, dropdownOwner: nextOwner };
  }),

  closeDropdown: () => set({ isDropdownOpen: false, dropdownOwner: null }),

  toggleDnd: () => set((s) => {
    const next = !s.isDndActive;
    persistDnd(next);
    return { isDndActive: next };
  }),

  enqueueModal: (notification) => {
    const { isModalOpen, modalQueue } = get();
    if (!isModalOpen) {
      set({ isModalOpen: true, modalQueue: [notification] });
    } else {
      set({ modalQueue: [...modalQueue, notification] });
    }
  },

  dismissModal: () => {
    const { modalQueue } = get();
    if (modalQueue.length > 1) {
      set({ modalQueue: modalQueue.slice(1) });
    } else {
      set({ isModalOpen: false, modalQueue: [] });
    }
  },

  // Estado limpo, exceto isDndActive que e preferencia por dispositivo e persiste.
  reset: () => set({
    notifications: [],
    unreadCount: 0,
    isDropdownOpen: false,
    dropdownOwner: null,
    ringToken: 0,
    modalQueue: [],
    isModalOpen: false,
  }),
}));
