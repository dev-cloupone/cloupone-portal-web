import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { mockGetAccessToken, mockSubscribeAccessToken, mockTryRefreshToken, tokenListeners } = vi.hoisted(() => {
  const listeners = new Set<(token: string | null) => void>()
  return {
    tokenListeners: listeners,
    mockGetAccessToken: vi.fn(),
    mockSubscribeAccessToken: vi.fn((listener: (token: string | null) => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    }),
    mockTryRefreshToken: vi.fn(),
  }
})

vi.mock('../../services/api', () => ({
  BASE_URL: 'http://localhost:3001/api',
  getAccessToken: mockGetAccessToken,
  subscribeAccessToken: mockSubscribeAccessToken,
  tryRefreshToken: mockTryRefreshToken,
}))

vi.mock('../../utils/notification-sound', () => ({
  playNotificationSound: vi.fn(),
}))

import { useNotificationSSE } from '../use-notification-sse'
import { useAuthStore } from '../../stores/auth.store'

const instances: MockEventSource[] = []

class MockEventSource {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2

  readyState = MockEventSource.CONNECTING
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  close = vi.fn(() => { this.readyState = MockEventSource.CLOSED })
  url: string

  constructor(url: string) {
    this.url = url
    instances.push(this)
  }
}

describe('useNotificationSSE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    instances.length = 0
    tokenListeners.clear()
    vi.useFakeTimers()
    vi.stubGlobal('EventSource', MockEventSource)
    mockGetAccessToken.mockReturnValue('token-1')
    mockTryRefreshToken.mockResolvedValue({ success: true })
    useAuthStore.setState({ user: { id: 'u1' } as never, isAuthenticated: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('opens a stream with the current token', () => {
    renderHook(() => useNotificationSSE())
    expect(instances).toHaveLength(1)
    expect(instances[0].url).toContain('token=token-1')
  })

  it('reopens the EventSource when the token rotates', () => {
    renderHook(() => useNotificationSSE())
    expect(instances).toHaveLength(1)

    act(() => {
      tokenListeners.forEach((listener) => listener('token-2'))
    })

    expect(instances[0].close).toHaveBeenCalled()
    expect(instances).toHaveLength(2)
    expect(instances[1].url).toContain('token=token-2')
  })

  it('refreshes the token and reconnects when readyState is CLOSED', async () => {
    renderHook(() => useNotificationSSE())
    const es = instances[0]
    es.readyState = MockEventSource.CLOSED
    mockGetAccessToken.mockReturnValue('token-refreshed')

    act(() => { es.onerror?.() })
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000) })

    expect(mockTryRefreshToken).toHaveBeenCalledTimes(1)
    expect(instances).toHaveLength(2)
    expect(instances[1].url).toContain('token=token-refreshed')
  })

  it('does not reconnect while the browser is retrying (CONNECTING)', async () => {
    renderHook(() => useNotificationSSE())
    const es = instances[0]
    es.readyState = MockEventSource.CONNECTING

    act(() => { es.onerror?.() })
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })

    expect(mockTryRefreshToken).not.toHaveBeenCalled()
    expect(instances).toHaveLength(1)
  })

  it('applies exponential backoff across attempts', async () => {
    renderHook(() => useNotificationSSE())

    // 1a falha: espera 1s
    instances[0].readyState = MockEventSource.CLOSED
    act(() => { instances[0].onerror?.() })
    await act(async () => { await vi.advanceTimersByTimeAsync(999) })
    expect(instances).toHaveLength(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(instances).toHaveLength(2)

    // 2a falha: espera 2s
    instances[1].readyState = MockEventSource.CLOSED
    act(() => { instances[1].onerror?.() })
    await act(async () => { await vi.advanceTimersByTimeAsync(1_999) })
    expect(instances).toHaveLength(2)
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(instances).toHaveLength(3)
  })

  it('resets the backoff after a successful open', async () => {
    renderHook(() => useNotificationSSE())

    instances[0].readyState = MockEventSource.CLOSED
    act(() => { instances[0].onerror?.() })
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000) })

    act(() => { instances[1].onopen?.() })
    instances[1].readyState = MockEventSource.CLOSED
    act(() => { instances[1].onerror?.() })
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000) })

    expect(instances).toHaveLength(3)
  })

  it('clears the retry timer and closes the stream on unmount', async () => {
    const { unmount } = renderHook(() => useNotificationSSE())
    const es = instances[0]
    es.readyState = MockEventSource.CLOSED
    act(() => { es.onerror?.() })

    unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })

    expect(es.close).toHaveBeenCalled()
    expect(mockTryRefreshToken).not.toHaveBeenCalled()
    expect(instances).toHaveLength(1)
  })

  it('does not open a stream without a token', () => {
    mockGetAccessToken.mockReturnValue(null)
    renderHook(() => useNotificationSSE())
    expect(instances).toHaveLength(0)
  })
})
