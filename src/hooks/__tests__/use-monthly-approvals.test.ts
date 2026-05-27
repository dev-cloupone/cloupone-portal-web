import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { mockList, mockApprove, mockReopen, mockGetDetail, mockAddToast, mockFormatApiError } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockApprove: vi.fn(),
  mockReopen: vi.fn(),
  mockGetDetail: vi.fn(),
  mockAddToast: vi.fn(),
  mockFormatApiError: vi.fn().mockReturnValue('error'),
}))

vi.mock('../../services/monthly-timesheet.service', () => ({
  list: mockList,
  approve: mockApprove,
  reopen: mockReopen,
  getDetail: mockGetDetail,
}))

vi.mock('../../services/api', () => ({
  formatApiError: mockFormatApiError,
}))

vi.mock('../../stores/toast.store', () => ({
  useToastStore: vi.fn((selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast })
  ),
}))

import { useMonthlyApprovals } from '../use-monthly-approvals'

const mockTimesheets = [
  { id: 'ts1', userId: 'u1', year: 2024, month: 6, status: 'open' },
  { id: 'ts2', userId: 'u2', year: 2024, month: 6, status: 'approved' },
]

describe('useMonthlyApprovals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockList.mockResolvedValue({ data: mockTimesheets, meta: { total: 2, page: 1, limit: 50, totalPages: 1 } })
  })

  describe('loadData', () => {
    it('loads paginated list of timesheets', async () => {
      const { result } = renderHook(() => useMonthlyApprovals())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.timesheets).toEqual(mockTimesheets)
      expect(result.current.total).toBe(2)
    })
  })

  describe('approveMonth', () => {
    it('approves timesheet and reloads list', async () => {
      mockApprove.mockResolvedValue(undefined)
      const { result } = renderHook(() => useMonthlyApprovals())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await act(async () => {
        await result.current.approveMonth('u1', 2024, 6)
      })
      expect(mockApprove).toHaveBeenCalledWith('u1', 2024, 6)
      expect(mockAddToast).toHaveBeenCalledWith('Mes aprovado com sucesso.', 'success')
    })

    it('closes detail after approval', async () => {
      mockApprove.mockResolvedValue(undefined)
      const { result } = renderHook(() => useMonthlyApprovals())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await act(async () => {
        await result.current.approveMonth('u1', 2024, 6)
      })
      expect(result.current.detail).toBeNull()
    })
  })

  describe('reopenMonth', () => {
    it('reopens timesheet with reason', async () => {
      mockReopen.mockResolvedValue(undefined)
      const { result } = renderHook(() => useMonthlyApprovals())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await act(async () => {
        await result.current.reopenMonth('u1', 2024, 6, 'Correcao')
      })
      expect(mockReopen).toHaveBeenCalledWith('u1', 2024, 6, 'Correcao')
      expect(mockAddToast).toHaveBeenCalledWith('Mes reaberto.', 'warning')
    })
  })

  describe('updateFilters', () => {
    it('updates filters and resets page to 1', async () => {
      const { result } = renderHook(() => useMonthlyApprovals())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      act(() => result.current.updateFilters({ status: 'open' }))
      expect(result.current.filters).toEqual({ status: 'open' })
      expect(result.current.page).toBe(1)
    })
  })

  describe('pendingCount', () => {
    it('counts timesheets with open or reopened status', async () => {
      const { result } = renderHook(() => useMonthlyApprovals())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.pendingCount).toBe(1) // only 'open' one
    })
  })
})
