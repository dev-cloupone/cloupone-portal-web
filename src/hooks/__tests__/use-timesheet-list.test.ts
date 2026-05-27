import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { mockUseAuth, mockGetTimeEntryList, mockListConsultants, mockListProjects } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockGetTimeEntryList: vi.fn(),
  mockListConsultants: vi.fn(),
  mockListProjects: vi.fn(),
}))

vi.mock('../use-auth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../../services/time-entry.service', () => ({
  getTimeEntryList: mockGetTimeEntryList,
}))

vi.mock('../../services/consultant.service', () => ({
  listConsultantsByScope: mockListConsultants,
}))

vi.mock('../../services/project.service', () => ({
  listProjects: mockListProjects,
}))

import { useTimesheetList } from '../use-timesheet-list'

describe('useTimesheetList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { role: 'super_admin', id: 'u1' } })
    mockGetTimeEntryList.mockResolvedValue({ entries: [], totalHours: '0.00' })
    mockListConsultants.mockResolvedValue({ data: [] })
    mockListProjects.mockResolvedValue({ data: [] })
  })

  describe('loading', () => {
    it('loads current month entries on mount', async () => {
      const { result } = renderHook(() => useTimesheetList())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(mockGetTimeEntryList).toHaveBeenCalled()
    })

    it('loads consultant list for admin/gestor', async () => {
      renderHook(() => useTimesheetList())
      await waitFor(() => expect(mockListConsultants).toHaveBeenCalled())
    })

    it('does not load consultants for consultor/client', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'consultor', id: 'u1' } })
      renderHook(() => useTimesheetList())
      // Wait a tick for effects
      await waitFor(() => expect(mockGetTimeEntryList).toHaveBeenCalled())
      expect(mockListConsultants).not.toHaveBeenCalled()
    })

    it('loads project list', async () => {
      renderHook(() => useTimesheetList())
      await waitFor(() => expect(mockListProjects).toHaveBeenCalled())
    })
  })

  describe('navigation', () => {
    it('goToPreviousMonth navigates to previous month', async () => {
      const { result } = renderHook(() => useTimesheetList())
      await waitFor(() => expect(result.current.loading).toBe(false))
      act(() => result.current.goToPreviousMonth())
      const now = new Date()
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const expected = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
      expect(result.current.currentMonth).toBe(expected)
    })

    it('goToNextMonth navigates to next month', async () => {
      const { result } = renderHook(() => useTimesheetList())
      await waitFor(() => expect(result.current.loading).toBe(false))
      act(() => result.current.goToNextMonth())
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const expected = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
      expect(result.current.currentMonth).toBe(expected)
    })

    it('goToToday goes back to current month', async () => {
      const { result } = renderHook(() => useTimesheetList())
      await waitFor(() => expect(result.current.loading).toBe(false))
      act(() => result.current.goToPreviousMonth())
      act(() => result.current.goToToday())
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      expect(result.current.currentMonth).toBe(expected)
    })
  })

  describe('filters', () => {
    it('updateFilters applies filter', async () => {
      const { result } = renderHook(() => useTimesheetList())
      await waitFor(() => expect(result.current.loading).toBe(false))
      act(() => result.current.updateFilters({ projectId: 'p1' }))
      expect(result.current.filters.projectId).toBe('p1')
    })

    it('clearFilters resets filters', async () => {
      const { result } = renderHook(() => useTimesheetList())
      await waitFor(() => expect(result.current.loading).toBe(false))
      act(() => result.current.updateFilters({ projectId: 'p1' }))
      act(() => result.current.clearFilters())
      expect(result.current.filters).toEqual({})
    })

    it('hasActiveFilters reflects filter state', async () => {
      const { result } = renderHook(() => useTimesheetList())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.hasActiveFilters).toBe(false)
      act(() => result.current.updateFilters({ projectId: 'p1' }))
      expect(result.current.hasActiveFilters).toBe(true)
    })
  })

  describe('state', () => {
    it('totalHours reflects sum of entries', async () => {
      mockGetTimeEntryList.mockResolvedValue({ entries: [{ hours: '3.00' }, { hours: '5.00' }], totalHours: '8.00' })
      const { result } = renderHook(() => useTimesheetList())
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.totalHours).toBe('8.00')
    })
  })
})
