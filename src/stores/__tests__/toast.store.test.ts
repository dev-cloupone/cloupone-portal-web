import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToastStore } from '../toast.store'

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('addToast', () => {
    it('adds toast with incremental id', () => {
      useToastStore.getState().addToast('Hello')
      expect(useToastStore.getState().toasts).toHaveLength(1)
      expect(useToastStore.getState().toasts[0].message).toBe('Hello')
      expect(useToastStore.getState().toasts[0].id).toBeTruthy()
    })

    it('auto-removes after 5 seconds', () => {
      useToastStore.getState().addToast('Temporary')
      expect(useToastStore.getState().toasts).toHaveLength(1)
      vi.advanceTimersByTime(5000)
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('supports types: success, error, warning, info', () => {
      useToastStore.getState().addToast('Success', 'success')
      useToastStore.getState().addToast('Error', 'error')
      useToastStore.getState().addToast('Warning', 'warning')
      useToastStore.getState().addToast('Info', 'info')
      const toasts = useToastStore.getState().toasts
      expect(toasts[0].type).toBe('success')
      expect(toasts[1].type).toBe('error')
      expect(toasts[2].type).toBe('warning')
      expect(toasts[3].type).toBe('info')
    })
  })

  describe('removeToast', () => {
    it('removes toast by id', () => {
      useToastStore.getState().addToast('Test')
      const id = useToastStore.getState().toasts[0].id
      useToastStore.getState().removeToast(id)
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('does not change state for non-existent id', () => {
      useToastStore.getState().addToast('Test')
      useToastStore.getState().removeToast('non-existent')
      expect(useToastStore.getState().toasts).toHaveLength(1)
    })
  })
})
