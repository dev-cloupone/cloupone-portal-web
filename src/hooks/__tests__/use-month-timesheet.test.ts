import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { mockGetMonthEntries, mockUpsertEntry, mockDeleteEntry, mockGetPending, mockApprove, mockAddToast } = vi.hoisted(() => ({
  mockGetMonthEntries: vi.fn(),
  mockUpsertEntry: vi.fn(),
  mockDeleteEntry: vi.fn(),
  mockGetPending: vi.fn(),
  mockApprove: vi.fn(),
  mockAddToast: vi.fn(),
}))

vi.mock('../../services/time-entry.service', () => ({
  getMonthEntries: mockGetMonthEntries,
  upsertEntry: mockUpsertEntry,
  deleteEntry: mockDeleteEntry,
}))

vi.mock('../../services/monthly-timesheet.service', () => ({
  getPending: mockGetPending,
  approve: mockApprove,
}))

vi.mock('../../stores/toast.store', () => ({
  useToastStore: vi.fn((selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast })
  ),
}))

import { useMonthTimesheet } from '../use-month-timesheet'

const mockMonthData = {
  entries: [
    { id: 'e1', date: '2024-06-10', startTime: '08:00', endTime: '09:00', hours: '1.00' },
  ],
  totalHours: 1,
  targetHours: 160,
  workingDays: 20,
  monthlyTimesheet: null,
}

describe('useMonthTimesheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMonthEntries.mockResolvedValue(mockMonthData)
    mockGetPending.mockResolvedValue([])
  })

  describe('navigation', () => {
    it('starts on the current month', () => {
      const { result } = renderHook(() => useMonthTimesheet())
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      expect(result.current.currentMonth).toBe(expected)
    })

    it('goToPreviousMonth navigates to previous month', async () => {
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      act(() => result.current.goToPreviousMonth())
      const now = new Date()
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const expected = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
      expect(result.current.currentMonth).toBe(expected)
    })

    it('goToNextMonth navigates to next month', async () => {
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      act(() => result.current.goToNextMonth())
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const expected = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
      expect(result.current.currentMonth).toBe(expected)
    })

    it('goToMonth(year, month) navigates to specific month', async () => {
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      act(() => result.current.goToMonth(2024, 3))
      expect(result.current.currentMonth).toBe('2024-03')
    })
  })

  describe('loading', () => {
    it('loads month data on initialization', async () => {
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockGetMonthEntries).toHaveBeenCalled()
      expect(result.current.monthData).toEqual(mockMonthData)
    })

    it('loads pending months on mount', async () => {
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockGetPending).toHaveBeenCalled()
    })
  })

  describe('saveEntry', () => {
    it('calls upsertEntry and reloads month', async () => {
      mockUpsertEntry.mockResolvedValue({ id: 'new' })
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await act(async () => {
        await result.current.saveEntry({ projectId: 'p1', date: '2024-06-10', startTime: '10:00', endTime: '11:00' } as never)
      })
      expect(mockUpsertEntry).toHaveBeenCalled()
    })

    it('shows error toast on failure', async () => {
      mockUpsertEntry.mockRejectedValue(new Error('fail'))
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      try {
        await act(async () => {
          await result.current.saveEntry({ projectId: 'p1' } as never)
        })
      } catch { /* expected */ }
      expect(mockAddToast).toHaveBeenCalledWith('fail', 'error')
    })
  })

  describe('deleteEntry', () => {
    it('calls deleteEntry and reloads month', async () => {
      mockDeleteEntry.mockResolvedValue(undefined)
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await act(async () => {
        await result.current.deleteEntry('e1')
      })
      expect(mockDeleteEntry).toHaveBeenCalledWith('e1')
    })

    it('shows success toast', async () => {
      mockDeleteEntry.mockResolvedValue(undefined)
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await act(async () => {
        await result.current.deleteEntry('e1')
      })
      expect(mockAddToast).toHaveBeenCalledWith('Registro removido.', 'success')
    })
  })

  describe('computed values', () => {
    it('calendarDays generates correct month grid', async () => {
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.calendarDays.length).toBeGreaterThan(0)
      // Grid should be multiple of 7 (full weeks)
      expect(result.current.calendarDays.length % 7).toBe(0)
    })

    it('isMonthEditable reflects timesheet status', async () => {
      mockGetMonthEntries.mockResolvedValue({
        ...mockMonthData,
        monthlyTimesheet: { status: 'approved' },
      })
      const { result } = renderHook(() => useMonthTimesheet())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.isMonthEditable).toBe(false)
    })
  })
})
