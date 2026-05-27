import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}))

vi.mock('../use-auth', () => ({
  useAuth: mockUseAuth,
}))

import { useNavItems, isNavGroup } from '../use-nav-items'

describe('useNavItems', () => {
  it('returns 5 groups for super_admin', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'super_admin' } })
    const { result } = renderHook(() => useNavItems())
    const groups = result.current.filter(isNavGroup)
    expect(groups).toHaveLength(5)
  })

  it('returns 3 groups for gestor', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'gestor' } })
    const { result } = renderHook(() => useNavItems())
    const groups = result.current.filter(isNavGroup)
    expect(groups).toHaveLength(3)
  })

  it('returns flat items (no groups) for consultor', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'consultor' } })
    const { result } = renderHook(() => useNavItems())
    const groups = result.current.filter(isNavGroup)
    expect(groups).toHaveLength(0)
    expect(result.current.length).toBeGreaterThan(0)
  })

  it('returns 2 flat items for client', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'client' } })
    const { result } = renderHook(() => useNavItems())
    expect(result.current).toHaveLength(2)
    expect(result.current.every(e => !isNavGroup(e))).toBe(true)
  })

  it('isNavGroup() returns true for group and false for item', () => {
    expect(isNavGroup({ group: 'Test', items: [] })).toBe(true)
    expect(isNavGroup({ label: 'Test', path: '/', icon: null })).toBe(false)
  })
})
