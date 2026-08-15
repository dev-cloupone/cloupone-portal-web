import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/notification.service', () => ({
  listNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}))

import { useNotificationStore } from '../notification.store'
import type { Notification } from '../../types/notification.types'

const mockNotification: Notification = {
  id: 'n1',
  userId: 'u1',
  type: 'ticket_created',
  title: 'Test notification',
  body: 'Body text',
  link: '/tickets/t1',
  isRead: false,
  metadata: null,
  createdAt: new Date().toISOString(),
}

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isDropdownOpen: false,
      isDndActive: false,
      modalQueue: [],
      isModalOpen: false,
    })
  })

  describe('addNotification', () => {
    it('adds notification at the beginning and increments unreadCount', () => {
      useNotificationStore.getState().addNotification(mockNotification)
      expect(useNotificationStore.getState().notifications).toHaveLength(1)
      expect(useNotificationStore.getState().notifications[0].id).toBe('n1')
      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })

    it('limits to 10 notifications', () => {
      for (let i = 0; i < 11; i++) {
        useNotificationStore.getState().addNotification({ ...mockNotification, id: `n${i}` })
      }
      expect(useNotificationStore.getState().notifications).toHaveLength(10)
    })
  })

  describe('markAsRead', () => {
    it('updates notification and decrements count', async () => {
      const { markAsRead: mockMarkAsRead } = await import('../../services/notification.service')
      vi.mocked(mockMarkAsRead).mockResolvedValue(undefined)

      useNotificationStore.setState({
        notifications: [mockNotification],
        unreadCount: 1,
      })

      await useNotificationStore.getState().markAsRead('n1')
      expect(useNotificationStore.getState().notifications[0].isRead).toBe(true)
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe('markAllAsRead', () => {
    it('marks all notifications as read and zeros count', async () => {
      const { markAllAsRead: mockMarkAll } = await import('../../services/notification.service')
      vi.mocked(mockMarkAll).mockResolvedValue(undefined)

      useNotificationStore.setState({
        notifications: [mockNotification, { ...mockNotification, id: 'n2' }],
        unreadCount: 2,
      })

      await useNotificationStore.getState().markAllAsRead()
      expect(useNotificationStore.getState().notifications.every(n => n.isRead)).toBe(true)
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe('toggleDropdown', () => {
    it('toggles isDropdownOpen', () => {
      useNotificationStore.getState().toggleDropdown()
      expect(useNotificationStore.getState().isDropdownOpen).toBe(true)
      useNotificationStore.getState().toggleDropdown()
      expect(useNotificationStore.getState().isDropdownOpen).toBe(false)
    })
  })

  describe('toggleDnd', () => {
    it('toggles isDndActive', () => {
      useNotificationStore.getState().toggleDnd()
      expect(useNotificationStore.getState().isDndActive).toBe(true)
    })
  })

  describe('enqueueModal', () => {
    it('opens modal if closed', () => {
      useNotificationStore.getState().enqueueModal(mockNotification)
      expect(useNotificationStore.getState().isModalOpen).toBe(true)
      expect(useNotificationStore.getState().modalQueue).toHaveLength(1)
    })

    it('adds to queue if modal already open', () => {
      useNotificationStore.setState({ isModalOpen: true, modalQueue: [mockNotification] })
      useNotificationStore.getState().enqueueModal({ ...mockNotification, id: 'n2' })
      expect(useNotificationStore.getState().modalQueue).toHaveLength(2)
    })
  })

  describe('dismissModal', () => {
    it('shows next notification in queue', () => {
      useNotificationStore.setState({
        isModalOpen: true,
        modalQueue: [mockNotification, { ...mockNotification, id: 'n2' }],
      })
      useNotificationStore.getState().dismissModal()
      expect(useNotificationStore.getState().modalQueue).toHaveLength(1)
      expect(useNotificationStore.getState().modalQueue[0].id).toBe('n2')
      expect(useNotificationStore.getState().isModalOpen).toBe(true)
    })

    it('closes modal if queue is empty', () => {
      useNotificationStore.setState({
        isModalOpen: true,
        modalQueue: [mockNotification],
      })
      useNotificationStore.getState().dismissModal()
      expect(useNotificationStore.getState().isModalOpen).toBe(false)
      expect(useNotificationStore.getState().modalQueue).toHaveLength(0)
    })
  })
})
