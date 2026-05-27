import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../use-pagination'

describe('usePagination', () => {
  it('starts with page=1 and default limit', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.page).toBe(1)
    expect(result.current.limit).toBe(20)
  })

  it('goToPage updates page', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.goToPage(3))
    expect(result.current.page).toBe(3)
  })

  it('nextPage increments when there is a next page', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setMeta({ page: 1, limit: 20, total: 100, totalPages: 5 }))
    act(() => result.current.nextPage())
    expect(result.current.page).toBe(2)
  })

  it('nextPage does not increment on the last page', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setMeta({ page: 5, limit: 20, total: 100, totalPages: 5 }))
    act(() => result.current.goToPage(5))
    act(() => result.current.nextPage())
    expect(result.current.page).toBe(5)
  })

  it('prevPage decrements when page > 1', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.goToPage(3))
    act(() => result.current.prevPage())
    expect(result.current.page).toBe(2)
  })

  it('prevPage does not decrement on page 1', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.prevPage())
    expect(result.current.page).toBe(1)
  })

  it('resetPage goes back to page 1', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.goToPage(5))
    act(() => result.current.resetPage())
    expect(result.current.page).toBe(1)
  })

  it('setMeta updates metadata', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setMeta({ page: 1, limit: 20, total: 50, totalPages: 3 }))
    expect(result.current.meta).toEqual({ page: 1, limit: 20, total: 50, totalPages: 3 })
  })

  it('setLimit updates limit', () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setLimit(10))
    expect(result.current.limit).toBe(10)
  })

  it('hasNextPage returns correct boolean', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.hasNextPage).toBe(false) // no meta
    act(() => result.current.setMeta({ page: 1, limit: 20, total: 50, totalPages: 3 }))
    expect(result.current.hasNextPage).toBe(true)
  })

  it('hasPrevPage returns correct boolean', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.hasPrevPage).toBe(false)
    act(() => result.current.goToPage(2))
    expect(result.current.hasPrevPage).toBe(true)
  })

  it('queryParams returns formatted string', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.queryParams).toBe('page=1&limit=20')
  })
})
