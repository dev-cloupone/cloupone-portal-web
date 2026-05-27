import { describe, it, expect } from 'vitest'
import { getHomeRoute } from '../get-home-route'
import type { User } from '../../types/auth.types'

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Test',
    email: 'test@test.com',
    role: 'consultor',
    ...overrides,
  }
}

describe('getHomeRoute', () => {
  it('returns /change-password-first when mustChangePassword=true', () => {
    expect(getHomeRoute(createUser({ mustChangePassword: true }))).toBe('/change-password-first')
  })

  it('returns /admin/dashboard for super_admin', () => {
    expect(getHomeRoute(createUser({ role: 'super_admin' }))).toBe('/admin/dashboard')
  })

  it('returns /admin/projects for gestor', () => {
    expect(getHomeRoute(createUser({ role: 'gestor' }))).toBe('/admin/projects')
  })

  it('returns /timesheet for consultor', () => {
    expect(getHomeRoute(createUser({ role: 'consultor' }))).toBe('/timesheet')
  })

  it('returns /tickets for client', () => {
    expect(getHomeRoute(createUser({ role: 'client' }))).toBe('/tickets')
  })

  it('returns /home for unknown role', () => {
    expect(getHomeRoute(createUser({ role: 'unknown' as User['role'] }))).toBe('/home')
  })
})
