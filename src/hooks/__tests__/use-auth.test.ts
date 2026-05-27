import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockState = {
  user: { id: 'u1', name: 'Test', email: 'test@test.com', role: 'consultor' },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  initialize: vi.fn(),
  setUser: vi.fn(),
}

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn(() => mockState),
}))

import { useAuth } from '../use-auth'

describe('useAuth', () => {
  it('delegates to useAuthStore and returns its state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current).toBe(mockState)
  })
})
