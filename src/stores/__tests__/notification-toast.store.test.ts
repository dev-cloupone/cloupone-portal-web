import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotificationToastStore, MAX_TOASTS, TOAST_TTL, TOAST_EXIT_DURATION } from '../notification-toast.store'
import type { Notification } from '../../types/notification.types'

function makeNotification(id: string): Notification {
  return {
    id,
    userId: 'u1',
    type: 'ticket_created',
    title: `Ticket ${id}`,
    body: 'Body',
    link: `/tickets/${id}`,
    isRead: false,
    metadata: { ticketCode: 'TK-1', projectName: 'Projeto X' },
    createdAt: new Date().toISOString(),
  }
}

describe('useNotificationToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useNotificationToastStore.getState().clear()
  })

  afterEach(() => {
    useNotificationToastStore.getState().clear()
    vi.useRealTimers()
  })

  it('empilha toasts na ordem de chegada', () => {
    useNotificationToastStore.getState().push(makeNotification('n1'))
    useNotificationToastStore.getState().push(makeNotification('n2'))

    const { toasts } = useNotificationToastStore.getState()
    expect(toasts).toHaveLength(2)
    expect(toasts[0].notification.id).toBe('n1')
    expect(toasts[1].notification.id).toBe('n2')
  })

  it(`remove o mais antigo ao exceder ${MAX_TOASTS}`, () => {
    for (let i = 1; i <= MAX_TOASTS + 1; i++) {
      useNotificationToastStore.getState().push(makeNotification(`n${i}`))
    }

    const { toasts } = useNotificationToastStore.getState()
    expect(toasts).toHaveLength(MAX_TOASTS)
    expect(toasts.map((t) => t.notification.id)).toEqual(['n2', 'n3', 'n4'])
  })

  it('faz auto-dismiss apos o TTL', () => {
    useNotificationToastStore.getState().push(makeNotification('n1'))

    vi.advanceTimersByTime(TOAST_TTL)
    expect(useNotificationToastStore.getState().toasts[0].exiting).toBe(true)

    vi.advanceTimersByTime(TOAST_EXIT_DURATION)
    expect(useNotificationToastStore.getState().toasts).toHaveLength(0)
  })

  it('dismiss manual limpa o timer de TTL e nao remove duas vezes', () => {
    useNotificationToastStore.getState().push(makeNotification('n1'))
    const id = useNotificationToastStore.getState().toasts[0].id

    useNotificationToastStore.getState().dismiss(id)
    // Segunda chamada e ignorada (ja esta saindo)
    useNotificationToastStore.getState().dismiss(id)

    vi.advanceTimersByTime(TOAST_EXIT_DURATION)
    expect(useNotificationToastStore.getState().toasts).toHaveLength(0)

    // Novo toast nao pode ser afetado pelo TTL do anterior
    useNotificationToastStore.getState().push(makeNotification('n2'))
    vi.advanceTimersByTime(TOAST_TTL - TOAST_EXIT_DURATION)
    expect(useNotificationToastStore.getState().toasts).toHaveLength(1)
  })

  it('clear remove todos os toasts e timers pendentes', () => {
    useNotificationToastStore.getState().push(makeNotification('n1'))
    useNotificationToastStore.getState().push(makeNotification('n2'))

    useNotificationToastStore.getState().clear()
    expect(useNotificationToastStore.getState().toasts).toHaveLength(0)

    vi.advanceTimersByTime(TOAST_TTL + TOAST_EXIT_DURATION)
    expect(useNotificationToastStore.getState().toasts).toHaveLength(0)
  })
})
