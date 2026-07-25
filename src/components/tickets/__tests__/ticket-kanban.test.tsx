import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockList = vi.fn()
const mockUpdate = vi.fn()
const mockAddToast = vi.fn()
const mockOnTicketUpdated = vi.fn()
const mockOnViewAllFinished = vi.fn()

vi.mock('../../../services/ticket.service', () => ({
  ticketService: {
    list: (...args: unknown[]) => mockList(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}))

vi.mock('../../../stores/toast.store', () => ({
  useToastStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}))

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}))

// Minimal dnd-kit mock to avoid DOM measurement errors
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCorners: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useSensor: vi.fn(),
  useSensors: () => [],
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: {},
}))

vi.mock('../ticket-card', () => ({
  TicketCard: ({ ticket }: { ticket: { id: string; title: string } }) => (
    <div data-testid={`ticket-${ticket.id}`}>{ticket.title}</div>
  ),
}))

import { TicketKanban } from '../ticket-kanban'

const defaultFilters = {
  projectId: '',
  status: 'active',
  type: '',
  priority: '',
  search: '',
  assignedTo: '',
}

function createTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: `t-${Math.random().toString(36).slice(2, 8)}`,
    code: 'PRJ-001',
    title: 'Test Ticket',
    description: 'Desc',
    type: 'question',
    priority: 'medium',
    status: 'open',
    projectId: 'p1',
    projectName: 'Project',
    clientName: 'Client',
    createdBy: 'u1',
    createdByName: 'User',
    assignedTo: null,
    assignedToName: null,
    isVisibleToClient: true,
    ccEmails: [],
    dueDate: null,
    estimatedHours: null,
    metadata: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function mockListResponses(mainTickets: unknown[], totalFinished: number) {
  mockList
    .mockResolvedValueOnce({
      data: mainTickets,
      meta: { page: 1, limit: 100, total: mainTickets.length, totalPages: 1 },
    })
    .mockResolvedValueOnce({
      data: [],
      meta: { page: 1, limit: 1, total: totalFinished, totalPages: totalFinished },
    })
}

describe('TicketKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('finished days selector', () => {
    it('renders days selector in finished column', async () => {
      mockListResponses([], 0)

      render(
        <TicketKanban
          filters={defaultFilters}
          projects={[]}
          onTicketUpdated={mockOnTicketUpdated}
          onViewAllFinished={mockOnViewAllFinished}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('finished-days-select')).toBeInTheDocument()
      })
    })

    it('defaults to 7 days', async () => {
      mockListResponses([], 0)

      render(
        <TicketKanban
          filters={defaultFilters}
          projects={[]}
          onTicketUpdated={mockOnTicketUpdated}
          onViewAllFinished={mockOnViewAllFinished}
        />,
      )

      await waitFor(() => {
        const select = screen.getByTestId('finished-days-select') as HTMLSelectElement
        expect(select.value).toBe('7')
      })
    })

    it('reads initial value from localStorage', async () => {
      localStorage.setItem('cloupone_kanban_finished_days', '30')
      mockListResponses([], 0)

      render(
        <TicketKanban
          filters={defaultFilters}
          projects={[]}
          onTicketUpdated={mockOnTicketUpdated}
          onViewAllFinished={mockOnViewAllFinished}
        />,
      )

      await waitFor(() => {
        const select = screen.getByTestId('finished-days-select') as HTMLSelectElement
        expect(select.value).toBe('30')
      })
    })

    it('persists selection to localStorage on change', async () => {
      mockListResponses([], 0)
      // Mock for re-fetch after state change
      mockListResponses([], 0)

      render(
        <TicketKanban
          filters={defaultFilters}
          projects={[]}
          onTicketUpdated={mockOnTicketUpdated}
          onViewAllFinished={mockOnViewAllFinished}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('finished-days-select')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('finished-days-select'), { target: { value: '15' } })

      expect(localStorage.getItem('cloupone_kanban_finished_days')).toBe('15')
    })

    it('passes finishedAfter param to ticketService.list', async () => {
      mockListResponses([], 0)

      render(
        <TicketKanban
          filters={defaultFilters}
          projects={[]}
          onTicketUpdated={mockOnTicketUpdated}
          onViewAllFinished={mockOnViewAllFinished}
        />,
      )

      await waitFor(() => {
        expect(mockList).toHaveBeenCalled()
      })

      // First call is the main ticket list (should have finishedAfter)
      const mainCall = mockList.mock.calls[0][0]
      expect(mainCall.finishedAfter).toBeDefined()
      expect(typeof mainCall.finishedAfter).toBe('string')

      // Verify it's roughly 7 days ago
      const finishedAfterDate = new Date(mainCall.finishedAfter)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const diffMs = Math.abs(finishedAfterDate.getTime() - sevenDaysAgo.getTime())
      expect(diffMs).toBeLessThan(5000) // within 5 seconds
    })
  })

  describe('hidden finished count', () => {
    it('shows hidden count when total > visible', async () => {
      const finishedTickets = [
        createTicket({ status: 'finished', id: 'f1' }),
        createTicket({ status: 'finished', id: 'f2' }),
        createTicket({ status: 'finished', id: 'f3' }),
      ]
      mockListResponses(finishedTickets, 15)

      render(
        <TicketKanban
          filters={defaultFilters}
          projects={[]}
          onTicketUpdated={mockOnTicketUpdated}
          onViewAllFinished={mockOnViewAllFinished}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('view-all-finished')).toBeInTheDocument()
      })

      // 15 total - 3 visible = 12 hidden
      expect(screen.getByTestId('view-all-finished').textContent).toContain('12')
    })

    it('does not show hidden count when total equals visible', async () => {
      const finishedTickets = [
        createTicket({ status: 'finished', id: 'f1' }),
        createTicket({ status: 'finished', id: 'f2' }),
      ]
      mockListResponses(finishedTickets, 2)

      render(
        <TicketKanban
          filters={defaultFilters}
          projects={[]}
          onTicketUpdated={mockOnTicketUpdated}
          onViewAllFinished={mockOnViewAllFinished}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('finished-days-select')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('view-all-finished')).not.toBeInTheDocument()
    })

    it('calls onViewAllFinished when clicking view all', async () => {
      const finishedTickets = [createTicket({ status: 'finished', id: 'f1' })]
      mockListResponses(finishedTickets, 10)

      render(
        <TicketKanban
          filters={defaultFilters}
          projects={[]}
          onTicketUpdated={mockOnTicketUpdated}
          onViewAllFinished={mockOnViewAllFinished}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('view-all-finished')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('view-all-finished'))
      expect(mockOnViewAllFinished).toHaveBeenCalled()
    })
  })
})
