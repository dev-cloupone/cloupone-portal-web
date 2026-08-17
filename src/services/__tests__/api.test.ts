import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { subscribeAccessToken, setAccessToken, clearAccessToken, getAccessToken } from '../api'

describe('subscribeAccessToken', () => {
  const unsubscribers: Array<() => void> = []

  function subscribe(listener: (token: string | null) => void) {
    const unsubscribe = subscribeAccessToken(listener)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    unsubscribers.splice(0).forEach((fn) => fn())
    clearAccessToken()
  })

  it('notifies listeners on setAccessToken', () => {
    const listener = vi.fn()
    subscribe(listener)

    setAccessToken('new-token')

    expect(listener).toHaveBeenCalledWith('new-token')
    expect(getAccessToken()).toBe('new-token')
  })

  it('notifies listeners with null on clearAccessToken', () => {
    setAccessToken('some-token')
    const listener = vi.fn()
    subscribe(listener)

    clearAccessToken()

    expect(listener).toHaveBeenCalledWith(null)
  })

  it('a throwing listener does not break setAccessToken', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    subscribe(() => { throw new Error('boom') })
    const healthy = vi.fn()
    subscribe(healthy)

    expect(() => setAccessToken('tok')).not.toThrow()
    expect(healthy).toHaveBeenCalledWith('tok')
    expect(getAccessToken()).toBe('tok')

    warn.mockRestore()
  })

  it('the returned function unsubscribes the listener', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    unsubscribe()
    setAccessToken('tok')

    expect(listener).not.toHaveBeenCalled()
  })
})
