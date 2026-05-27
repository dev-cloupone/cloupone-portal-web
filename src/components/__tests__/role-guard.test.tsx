import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}))

vi.mock('../../hooks/use-auth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('react-router', () => ({
  Navigate: vi.fn(({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />),
}))

import { RoleGuard } from '../role-guard'

describe('RoleGuard', () => {
  it('renders children when role is in allowedRoles', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'super_admin' } })
    render(<RoleGuard allowedRoles={['super_admin', 'gestor']}><div>Allowed</div></RoleGuard>)
    expect(screen.getByText('Allowed')).toBeInTheDocument()
  })

  it('redirects to /login when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(<RoleGuard allowedRoles={['super_admin']}><div>Content</div></RoleGuard>)
    expect(screen.getByTestId('navigate').getAttribute('data-to')).toBe('/login')
  })

  it('redirects when role is not in allowedRoles', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'consultor' } })
    render(<RoleGuard allowedRoles={['super_admin']}><div>Content</div></RoleGuard>)
    expect(screen.getByTestId('navigate').getAttribute('data-to')).toBe('/login')
  })
})
