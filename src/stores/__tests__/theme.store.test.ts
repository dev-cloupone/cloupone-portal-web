import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useThemeStore } from '../theme.store'

describe('useThemeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
    useThemeStore.setState({ theme: 'dark' })
  })

  describe('setTheme', () => {
    it('updates state with new theme', () => {
      useThemeStore.getState().setTheme('light')
      expect(useThemeStore.getState().theme).toBe('light')
    })

    it('sets data-theme on document.documentElement', () => {
      useThemeStore.getState().setTheme('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('sets colorScheme on style', () => {
      useThemeStore.getState().setTheme('light')
      expect(document.documentElement.style.colorScheme).toBe('light')
    })

    it('persists in localStorage', () => {
      useThemeStore.getState().setTheme('light')
      expect(localStorage.getItem('template-base-theme')).toBe('light')
    })
  })

  describe('toggleTheme', () => {
    it('toggles from dark to light', () => {
      useThemeStore.setState({ theme: 'dark' })
      useThemeStore.getState().toggleTheme()
      expect(useThemeStore.getState().theme).toBe('light')
    })

    it('toggles from light to dark', () => {
      useThemeStore.setState({ theme: 'light' })
      useThemeStore.getState().toggleTheme()
      expect(useThemeStore.getState().theme).toBe('dark')
    })
  })

  describe('initialize', () => {
    it('loads theme from localStorage', () => {
      localStorage.setItem('template-base-theme', 'light')
      useThemeStore.getState().initialize()
      expect(useThemeStore.getState().theme).toBe('light')
    })

    it('uses dark as default when localStorage is empty', () => {
      useThemeStore.getState().initialize()
      expect(useThemeStore.getState().theme).toBe('dark')
    })

    it('applies theme to DOM', () => {
      localStorage.setItem('template-base-theme', 'light')
      useThemeStore.getState().initialize()
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })
  })
})
