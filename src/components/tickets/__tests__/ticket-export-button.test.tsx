import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockExport = vi.fn()
const mockAddToast = vi.fn()

vi.mock('../../../services/ticket.service', () => ({
  ticketService: {
    export: (...args: unknown[]) => mockExport(...args),
  },
}))

vi.mock('../../../stores/toast.store', () => ({
  useToastStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}))

let mockUser: { role: string } | null = { role: 'gestor' }
vi.mock('../../../hooks/use-auth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

import { TicketExportButton } from '../ticket-export-button'

const params = { projectId: 'p1', sort: 'updated_at' as const, order: 'desc' as const }

function mockResponse(): Response {
  return {
    blob: vi.fn().mockResolvedValue(new Blob(['fake'])),
    headers: new Headers({ 'content-disposition': 'attachment; filename="tickets-2026-03-05-1130.xlsx"' }),
  } as unknown as Response
}

describe('TicketExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { role: 'gestor' }
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('does not render when user role is client', () => {
    mockUser = { role: 'client' }
    render(<TicketExportButton params={params} />)
    expect(screen.queryByText('Exportar')).not.toBeInTheDocument()
  })

  it.each(['super_admin', 'gestor', 'consultor'])('renders for role %s', (role) => {
    mockUser = { role }
    render(<TicketExportButton params={params} />)
    expect(screen.getByText('Exportar')).toBeInTheDocument()
  })

  it('calls ticketService.export with the received params on click', async () => {
    mockExport.mockResolvedValue(mockResponse())
    render(<TicketExportButton params={params} />)

    fireEvent.click(screen.getByText('Exportar'))

    await waitFor(() => expect(mockExport).toHaveBeenCalledWith(params))
  })

  it('disables the button and shows a spinner while exporting', async () => {
    let resolveExport: (value: Response) => void = () => {}
    mockExport.mockReturnValue(new Promise((resolve) => { resolveExport = resolve }))
    render(<TicketExportButton params={params} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => expect(button).toBeDisabled())
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()

    resolveExport(mockResponse())
    await waitFor(() => expect(button).not.toBeDisabled())
  })

  it('creates and clicks an anchor with the filename from content-disposition on success', async () => {
    mockExport.mockResolvedValue(mockResponse())
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<TicketExportButton params={params} />)

    fireEvent.click(screen.getByText('Exportar'))

    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')

    clickSpy.mockRestore()
  })

  it('calls addToast with the formatted error message on failure', async () => {
    mockExport.mockRejectedValue(Object.assign(new Error('Nenhum ticket encontrado com os filtros aplicados.'), { code: 'TICKET_EXPORT_NO_RESULTS' }))
    render(<TicketExportButton params={params} />)

    fireEvent.click(screen.getByText('Exportar'))

    await waitFor(() => expect(mockAddToast).toHaveBeenCalled())
    expect(mockAddToast).toHaveBeenCalledWith(expect.any(String), 'error')
  })
})
