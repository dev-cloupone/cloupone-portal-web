import { create } from 'zustand';
import type { Notification } from '../types/notification.types';
import * as notificationService from '../services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isDropdownOpen: boolean;
  isDndActive: boolean;
  modalQueue: Notification[];
  isModalOpen: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  toggleDnd: () => void;
  enqueueModal: (notification: Notification) => void;
  dismissModal: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isDropdownOpen: false,
  isDndActive: false,
  modalQueue: [],
  isModalOpen: false,

  fetchNotifications: async () => {
    const { data } = await notificationService.listNotifications({ limit: 10 });
    set({ notifications: data });
  },

  fetchUnreadCount: async () => {
    const { count } = await notificationService.getUnreadCount();
    set({ unreadCount: count });
  },

  markAsRead: async (id) => {
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
      notifications: [notification, ...s.notifications].slice(0, 10),
      unreadCount: s.unreadCount + 1,
    }));
  },

  toggleDropdown: () => set((s) => ({ isDropdownOpen: !s.isDropdownOpen })),
  closeDropdown: () => set({ isDropdownOpen: false }),
  toggleDnd: () => set((s) => ({ isDndActive: !s.isDndActive })),

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
}));
