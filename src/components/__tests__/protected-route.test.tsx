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

import { ProtectedRoute } from '../protected-route'

describe('ProtectedRoute', () => {
  it('renders loading spinner when isLoading=true', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true })
    render(<ProtectedRoute><div>Content</div></ProtectedRoute>)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false })
    render(<ProtectedRoute><div>Content</div></ProtectedRoute>)
    expect(screen.getByTestId('navigate').getAttribute('data-to')).toBe('/login')
  })

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false })
    render(<ProtectedRoute><div>Protected Content</div></ProtectedRoute>)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
