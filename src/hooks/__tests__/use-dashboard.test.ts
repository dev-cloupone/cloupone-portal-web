import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const { mockGetDashboard, mockFormatApiError } = vi.hoisted(() => ({
  mockGetDashboard: vi.fn(),
  mockFormatApiError: vi.fn().mockReturnValue('error msg'),
}))

vi.mock('../../services/dashboard.service', () => ({
  getDashboard: mockGetDashboard,
}))

vi.mock('../../services/api', () => ({
  formatApiError: mockFormatApiError,
}))

import { useDashboard } from '../use-dashboard'

describe('useDashboard', () => {
  it('loads dashboard data on mount', async () => {
    mockGetDashboard.mockResolvedValue({ stats: {} })
    const { result } = renderHook(() => useDashboard())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual({ stats: {} })
  })

  it('sets isLoading during loading', () => {
    mockGetDashboard.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useDashboard())
    expect(result.current.isLoading).toBe(true)
  })

  it('sets data after success', async () => {
    const mockData = { totalHours: 100 }
    mockGetDashboard.mockResolvedValue(mockData)
    const { result } = renderHook(() => useDashboard())
    await waitFor(() => expect(result.current.data).toEqual(mockData))
  })

  it('sets error after failure', async () => {
    mockGetDashboard.mockRejectedValue(new Error('fail'))
    mockFormatApiError.mockReturnValue('Dashboard error')
    const { result } = renderHook(() => useDashboard())
    await waitFor(() => expect(result.current.error).toBe('Dashboard error'))
  })
})
