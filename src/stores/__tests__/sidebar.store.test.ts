import { describe, it, expect, beforeEach } from 'vitest'
import { useSidebarStore } from '../sidebar.store'

describe('useSidebarStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSidebarStore.setState({ isOpen: false, isCollapsed: false })
  })

  it('open() sets isOpen=true', () => {
    useSidebarStore.getState().open()
    expect(useSidebarStore.getState().isOpen).toBe(true)
  })

  it('close() sets isOpen=false', () => {
    useSidebarStore.setState({ isOpen: true })
    useSidebarStore.getState().close()
    expect(useSidebarStore.getState().isOpen).toBe(false)
  })

  it('toggle() toggles isOpen', () => {
    expect(useSidebarStore.getState().isOpen).toBe(false)
    useSidebarStore.getState().toggle()
    expect(useSidebarStore.getState().isOpen).toBe(true)
    useSidebarStore.getState().toggle()
    expect(useSidebarStore.getState().isOpen).toBe(false)
  })

  it('toggleCollapse() toggles isCollapsed', () => {
    expect(useSidebarStore.getState().isCollapsed).toBe(false)
    useSidebarStore.getState().toggleCollapse()
    expect(useSidebarStore.getState().isCollapsed).toBe(true)
    useSidebarStore.getState().toggleCollapse()
    expect(useSidebarStore.getState().isCollapsed).toBe(false)
  })

  it('persists only isCollapsed via persist middleware', () => {
    useSidebarStore.getState().toggleCollapse()
    const stored = JSON.parse(localStorage.getItem('sidebar-collapsed') || '{}')
    expect(stored.state).toHaveProperty('isCollapsed', true)
    // isOpen should NOT be persisted
    expect(stored.state).not.toHaveProperty('isOpen')
  })
})
