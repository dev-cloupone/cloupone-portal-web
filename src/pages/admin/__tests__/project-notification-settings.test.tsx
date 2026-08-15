import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const {
  mockGetProject,
  mockGetSettings,
  mockGetEmails,
  mockUpsertSettings,
  mockAddEmail,
  mockRemoveEmail,
  mockAddToast,
} = vi.hoisted(() => ({
  mockGetProject: vi.fn(),
  mockGetSettings: vi.fn(),
  mockGetEmails: vi.fn(),
  mockUpsertSettings: vi.fn(),
  mockAddEmail: vi.fn(),
  mockRemoveEmail: vi.fn(),
  mockAddToast: vi.fn(),
}))

vi.mock('react-router', () => ({
  useParams: () => ({ id: 'project-1' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('../../../components/ui/sidebar-layout', () => ({
  SidebarLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../../hooks/use-nav-items', () => ({
  useNavItems: () => [],
}))

vi.mock('../../../stores/toast.store', () => ({
  useToastStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}))

vi.mock('../../../services/api', () => ({
  api: vi.fn(),
  formatApiError: (err: unknown) => String(err),
}))

vi.mock('../../../services/project.service', () => ({
  getProject: mockGetProject,
}))

vi.mock('../../../services/project-notification-settings.service', () => ({
  getSettings: mockGetSettings,
  getEmails: mockGetEmails,
  upsertSettings: mockUpsertSettings,
  addEmail: mockAddEmail,
  removeEmail: mockRemoveEmail,
}))

import ProjectNotificationSettingsPage from '../project-notification-settings'

const USERS = [
  {
    userId: 'u1',
    userName: 'Ana Souza',
    userEmail: 'ana@example.com',
    userRole: 'gestor',
    eventType: 'ticket_created',
    channelEmail: true,
    channelInApp: false,
  },
  {
    userId: 'u2',
    userName: 'Bruno Lima',
    userEmail: 'bruno@example.com',
    userRole: 'consultor',
    eventType: 'ticket_created',
    channelEmail: false,
    channelInApp: true,
  },
]

const EMAILS = [
  { id: 'e1', email: 'externo@cliente.com', eventType: 'ticket_created', createdAt: '2026-01-01' },
]

describe('ProjectNotificationSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetProject.mockResolvedValue({ id: 'project-1', name: 'Projeto Alpha' })
    mockGetSettings.mockResolvedValue({ data: USERS })
    mockGetEmails.mockResolvedValue({ data: EMAILS })
    mockUpsertSettings.mockResolvedValue(undefined)
  })

  it('renders allocated users with their channels', async () => {
    render(<ProjectNotificationSettingsPage />)

    expect(await screen.findByText('Projeto Alpha')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument()

    expect(screen.getByLabelText('Email - Ana Souza')).toBeChecked()
    expect(screen.getByLabelText('In-App - Ana Souza')).not.toBeChecked()
    expect(screen.getByLabelText('Email - Bruno Lima')).not.toBeChecked()
    expect(screen.getByLabelText('In-App - Bruno Lima')).toBeChecked()
  })

  it('shows the configured event label on the channel headers', async () => {
    render(<ProjectNotificationSettingsPage />)
    await screen.findByText('Ana Souza')

    // one per channel column header + one per external email
    expect(screen.getAllByText('Criação de ticket').length).toBeGreaterThanOrEqual(2)
  })

  it('shows the event of each external email', async () => {
    render(<ProjectNotificationSettingsPage />)

    expect(await screen.findByText('externo@cliente.com')).toBeInTheDocument()
    const emailRow = screen.getByText('externo@cliente.com').parentElement
    expect(emailRow).toHaveTextContent('Criação de ticket')
  })

  it('does not render raw i18n keys', async () => {
    render(<ProjectNotificationSettingsPage />)
    await screen.findByText('Ana Souza')

    expect(screen.queryByText(/^common\./)).toBeNull()
    expect(screen.queryByText(/^projects\./)).toBeNull()
  })

  it('sends the toggled settings on save', async () => {
    render(<ProjectNotificationSettingsPage />)
    await screen.findByText('Ana Souza')

    fireEvent.click(screen.getByLabelText('In-App - Ana Souza'))
    fireEvent.click(screen.getByText('Salvar alterações'))

    await waitFor(() => expect(mockUpsertSettings).toHaveBeenCalledTimes(1))
    expect(mockUpsertSettings).toHaveBeenCalledWith('project-1', [
      { userId: 'u1', eventType: 'ticket_created', channelEmail: true, channelInApp: true },
      { userId: 'u2', eventType: 'ticket_created', channelEmail: false, channelInApp: true },
    ])
  })

  it('shows the empty state when no user is allocated', async () => {
    mockGetSettings.mockResolvedValue({ data: [] })
    render(<ProjectNotificationSettingsPage />)

    expect(await screen.findByText('Nenhum usuário alocado a este projeto')).toBeInTheDocument()
  })
})
