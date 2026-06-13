import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockAddToast = vi.fn()
vi.mock('../../../stores/toast.store', () => ({
  useToastStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}))

const mockValidateImport = vi.fn()
const mockConfirmImport = vi.fn()
vi.mock('../../../services/time-entry-import.service', () => ({
  validateImport: (...args: unknown[]) => mockValidateImport(...args),
  confirmImport: (...args: unknown[]) => mockConfirmImport(...args),
}))

vi.mock('../../../utils/import-template', () => ({
  downloadImportTemplate: vi.fn(),
}))

vi.mock('../../../services/api', () => ({
  formatApiError: (err: Error) => err.message,
}))

import { ImportModal } from '../import-modal'

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onImportSuccess: vi.fn(),
  consultants: [
    { id: 'c1', name: 'João' },
    { id: 'c2', name: 'Maria' },
  ],
  isAdminOrGestor: false,
}

const mockValidationResult = {
  valid: 2,
  warnings: 1,
  errors: 1,
  rows: [
    { row: 1, data: { date: '02/06/2026', project: 'Proj A', subphase: 'Sub 1', ticket: null, startTime: '09:00', endTime: '12:00', description: null }, status: 'valid' as const, message: null, resolvedIds: { projectId: 'p1', subphaseId: 'sp1', ticketId: null } },
    { row: 2, data: { date: '02/06/2026', project: 'Proj A', subphase: 'Sub 1', ticket: null, startTime: '13:00', endTime: '18:00', description: null }, status: 'valid' as const, message: null, resolvedIds: { projectId: 'p1', subphaseId: 'sp1', ticketId: null } },
    { row: 3, data: { date: '02/06/2026', project: 'Proj A', subphase: 'Sub 1', ticket: null, startTime: '09:00', endTime: '12:00', description: null }, status: 'warning' as const, message: 'Apontamento duplicado já existe no sistema.', resolvedIds: { projectId: 'p1', subphaseId: 'sp1', ticketId: null } },
    { row: 4, data: { date: '99/99/9999', project: 'Proj A', subphase: 'Sub 1', ticket: null, startTime: '09:00', endTime: '12:00', description: null }, status: 'error' as const, message: 'Data inválida.', resolvedIds: null },
  ],
}

describe('ImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal with upload state when open', () => {
    render(<ImportModal {...defaultProps} />)
    expect(screen.getByText('Importar Apontamentos')).toBeInTheDocument()
    expect(screen.getByText('Validar')).toBeInTheDocument()
  })

  it('does not render when not open', () => {
    render(<ImportModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Importar Apontamentos')).not.toBeInTheDocument()
  })

  it('shows consultant dropdown only for admin/gestor', () => {
    const { rerender } = render(<ImportModal {...defaultProps} isAdminOrGestor={true} />)
    expect(screen.getByText('Consultor')).toBeInTheDocument()

    rerender(<ImportModal {...defaultProps} isAdminOrGestor={false} />)
    expect(screen.queryByText('Consultor')).not.toBeInTheDocument()
  })

  it('validate button is disabled without file', () => {
    render(<ImportModal {...defaultProps} />)
    expect(screen.getByText('Validar')).toBeDisabled()
  })

  it('transitions to preview after validation', async () => {
    mockValidateImport.mockResolvedValue(mockValidationResult)
    render(<ImportModal {...defaultProps} />)

    const input = document.getElementById('import-file-input') as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    fireEvent.change(input, { target: { files: [file] } })

    fireEvent.click(screen.getByText('Validar'))

    await waitFor(() => {
      expect(screen.getByText('2 válidas')).toBeInTheDocument()
      expect(screen.getByText('1 avisos')).toBeInTheDocument()
      expect(screen.getByText('1 erros')).toBeInTheDocument()
    })
  })

  it('shows correct row count in import button', async () => {
    mockValidateImport.mockResolvedValue(mockValidationResult)
    render(<ImportModal {...defaultProps} />)

    const input = document.getElementById('import-file-input') as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByText('Validar'))

    await waitFor(() => {
      expect(screen.getByText('Importar 2 entradas')).toBeInTheDocument()
    })
  })

  it('shows duplicate checkbox when warnings exist', async () => {
    mockValidateImport.mockResolvedValue(mockValidationResult)
    render(<ImportModal {...defaultProps} />)

    const input = document.getElementById('import-file-input') as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByText('Validar'))

    await waitFor(() => {
      expect(screen.getByText('Importar duplicatas mesmo assim')).toBeInTheDocument()
    })
  })

  it('updates count when including duplicates', async () => {
    mockValidateImport.mockResolvedValue(mockValidationResult)
    render(<ImportModal {...defaultProps} />)

    const input = document.getElementById('import-file-input') as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByText('Validar'))

    await waitFor(() => {
      expect(screen.getByText('Importar 2 entradas')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Importar duplicatas mesmo assim'))

    expect(screen.getByText('Importar 3 entradas')).toBeInTheDocument()
  })

  it('transitions to result after confirmation', async () => {
    mockValidateImport.mockResolvedValue(mockValidationResult)
    mockConfirmImport.mockResolvedValue({ imported: 2, skipped: 0 })
    render(<ImportModal {...defaultProps} />)

    const input = document.getElementById('import-file-input') as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByText('Validar'))

    await waitFor(() => {
      expect(screen.getByText('Importar 2 entradas')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Importar 2 entradas'))

    await waitFor(() => {
      expect(screen.getByText('2 apontamentos importados com sucesso!')).toBeInTheDocument()
    })
  })

  it('calls onClose and onImportSuccess when closing from result', async () => {
    mockValidateImport.mockResolvedValue(mockValidationResult)
    mockConfirmImport.mockResolvedValue({ imported: 2, skipped: 0 })
    render(<ImportModal {...defaultProps} />)

    const input = document.getElementById('import-file-input') as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByText('Validar'))

    await waitFor(() => screen.getByText('Importar 2 entradas'))
    fireEvent.click(screen.getByText('Importar 2 entradas'))

    await waitFor(() => screen.getByText('Fechar'))
    fireEvent.click(screen.getByText('Fechar'))

    expect(defaultProps.onClose).toHaveBeenCalled()
    expect(defaultProps.onImportSuccess).toHaveBeenCalled()
  })

  it('disables import button when all rows have errors', async () => {
    const allErrors = {
      valid: 0, warnings: 0, errors: 2,
      rows: [
        { row: 1, data: { date: '99/99/9999', project: 'A', subphase: 'B', ticket: null, startTime: '09:00', endTime: '12:00', description: null }, status: 'error' as const, message: 'Data inválida.', resolvedIds: null },
        { row: 2, data: { date: '88/88/8888', project: 'A', subphase: 'B', ticket: null, startTime: '09:00', endTime: '12:00', description: null }, status: 'error' as const, message: 'Data inválida.', resolvedIds: null },
      ],
    }
    mockValidateImport.mockResolvedValue(allErrors)
    render(<ImportModal {...defaultProps} />)

    const input = document.getElementById('import-file-input') as HTMLInputElement
    const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByText('Validar'))

    await waitFor(() => {
      expect(screen.getByText('Importar 0 entradas')).toBeDisabled()
    })
  })
})
