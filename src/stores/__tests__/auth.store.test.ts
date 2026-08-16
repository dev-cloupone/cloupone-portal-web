import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockLogin, mockLogout, mockSetAccessToken, mockClearAccessToken, mockTryRefreshToken, mockSetOnAuthFailure } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
  mockSetAccessToken: vi.fn(),
  mockClearAccessToken: vi.fn(),
  mockTryRefreshToken: vi.fn(),
  mockSetOnAuthFailure: vi.fn(),
}))

vi.mock('../../services/auth.service', () => ({
  login: mockLogin,
  logout: mockLogout,
}))

vi.mock('../../services/api', () => ({
  setAccessToken: mockSetAccessToken,
  clearAccessToken: mockClearAccessToken,
  tryRefreshToken: mockTryRefreshToken,
  setOnAuthFailure: mockSetOnAuthFailure,
}))

vi.mock('../../services/notification.service', () => ({
  listNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}))

import { useAuthStore } from '../auth.store'
import { useNotificationStore } from '../notification.store'
import { useNotificationToastStore } from '../notification-toast.store'

const mockUser = {
  id: 'u1', name: 'Test', email: 'test@test.com', role: 'consultor' as const,
  mustChangePassword: false,
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset store state
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true })
  })

  describe('login', () => {
    it('calls authService.login and updates state', async () => {
      mockLogin.mockResolvedValue({ accessToken: 'at1', user: mockUser })
      await useAuthStore.getState().login('test@test.com', 'pw')
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'pw')
      expect(useAuthStore.getState().user).toEqual(mockUser)
    })

    it('sets isAuthenticated=true after login', async () => {
      mockLogin.mockResolvedValue({ accessToken: 'at1', user: mockUser })
      await useAuthStore.getState().login('test@test.com', 'pw')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('sets accessToken via api.setAccessToken', async () => {
      mockLogin.mockResolvedValue({ accessToken: 'at1', user: mockUser })
      await useAuthStore.getState().login('test@test.com', 'pw')
      expect(mockSetAccessToken).toHaveBeenCalledWith('at1')
    })

    it('persists user in localStorage', async () => {
      mockLogin.mockResolvedValue({ accessToken: 'at1', user: mockUser })
      await useAuthStore.getState().login('test@test.com', 'pw')
      expect(localStorage.getItem('user')).toBeTruthy()
      expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser)
    })
  })

  describe('logout', () => {
    it('calls authService.logout', async () => {
      mockLogout.mockResolvedValue(undefined)
      await useAuthStore.getState().logout()
      expect(mockLogout).toHaveBeenCalled()
    })

    it('clears accessToken', async () => {
      mockLogout.mockResolvedValue(undefined)
      await useAuthStore.getState().logout()
      expect(mockClearAccessToken).toHaveBeenCalled()
    })

    it('resets state (user=null, isAuthenticated=false)', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      mockLogout.mockResolvedValue(undefined)
      await useAuthStore.getState().logout()
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('removes user from localStorage', async () => {
      localStorage.setItem('user', JSON.stringify(mockUser))
      mockLogout.mockResolvedValue(undefined)
      await useAuthStore.getState().logout()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('resets the notification store', async () => {
      mockLogout.mockResolvedValue(undefined)
      useNotificationStore.setState({ unreadCount: 3, isModalOpen: true, modalQueue: [{ id: 'n1' } as never] })

      await useAuthStore.getState().logout()

      expect(useNotificationStore.getState().unreadCount).toBe(0)
      expect(useNotificationStore.getState().isModalOpen).toBe(false)
      expect(useNotificationStore.getState().modalQueue).toHaveLength(0)
    })

    it('clears the notification toasts', async () => {
      mockLogout.mockResolvedValue(undefined)
      useNotificationToastStore.setState({ toasts: [{ id: 't1', notification: { id: 'n1' } as never }] })

      await useAuthStore.getState().logout()

      expect(useNotificationToastStore.getState().toasts).toHaveLength(0)
    })
  })

  describe('initialize', () => {
    it('attempts refresh token and loads user from localStorage', async () => {
      mockTryRefreshToken.mockResolvedValue({ success: true })
      localStorage.setItem('user', JSON.stringify(mockUser))
      await useAuthStore.getState().initialize()
      expect(mockTryRefreshToken).toHaveBeenCalled()
      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('registers auth failure callback', async () => {
      mockTryRefreshToken.mockResolvedValue({ success: false })
      await useAuthStore.getState().initialize()
      expect(mockSetOnAuthFailure).toHaveBeenCalledWith(expect.any(Function))
    })

    it('does not authenticate if refresh fails', async () => {
      mockTryRefreshToken.mockResolvedValue({ success: false })
      await useAuthStore.getState().initialize()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('setUser', () => {
    it('updates user in state', () => {
      useAuthStore.getState().setUser(mockUser)
      expect(useAuthStore.getState().user).toEqual(mockUser)
    })
  })
})
