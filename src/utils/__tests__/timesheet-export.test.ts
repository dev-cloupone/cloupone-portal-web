import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

// Mock jsPDF
const mockDoc = {
  addImage: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  line: vi.fn(),
  save: vi.fn(),
  setPage: vi.fn(),
  getNumberOfPages: vi.fn().mockReturnValue(1),
  internal: { pageSize: { getWidth: () => 297, getHeight: () => 210 } },
}

vi.mock('jspdf', () => ({
  jsPDF: function () { return mockDoc },
}))

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))

// Mock fetch for logo loading - FileReader needs function keyword for `new`
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob(['fake'])) }))
vi.stubGlobal('FileReader', function (this: { onloadend: (() => void) | null; result: string; readAsDataURL: () => void }) {
  this.onloadend = null
  this.result = 'data:image/png;base64,fakedata'
  this.readAsDataURL = () => {
    setTimeout(() => { if (this.onloadend) this.onloadend() }, 0)
  }
} as unknown as typeof FileReader)

afterAll(() => {
  vi.unstubAllGlobals()
})

import { exportToExcel, exportToPdf } from '../timesheet-export'
import * as XLSX from 'xlsx'
import type { TimeEntryListItem } from '../../types/time-entry.types'

const mockEntries: TimeEntryListItem[] = [
  {
    id: 'e1', date: '2024-06-10', startTime: '08:00:00', endTime: '09:00:00',
    hours: '1.00', description: 'Test', consultantId: 'u1', consultantName: 'John',
    projectId: 'p1', projectName: 'Project A', subphaseId: null, subphaseName: '', phaseName: null,
    ticketId: null, ticketCode: '', ticketTitle: '',
  },
]

const mockEntriesWithRates: TimeEntryListItem[] = [
  {
    id: 'e1', date: '2024-06-10', startTime: '08:00:00', endTime: '09:00:00',
    hours: '1.00', adjustedHours: '2.00', description: 'Test', consultantId: 'u1', consultantName: 'John',
    projectId: 'p1', projectName: 'Project A', subphaseId: null, subphaseName: '', phaseName: null,
    ticketId: null, ticketCode: '', ticketTitle: '',
    billingRate: '120.00', costRate: '60.00',
    partnerBillingRate: '100.00', partnerCostRate: '50.00',
  },
]

describe('exportToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates XLSX file with headers and data', () => {
    exportToExcel({
      entries: mockEntries, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false,
    })
    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('adds total row at the end', () => {
    exportToExcel({
      entries: mockEntries, totalHours: '8.00', currentMonth: '2024-06',
      showConsultantColumn: false,
    })
    // aoa_to_sheet is called with [headers, ...dataRows, totalRow]
    const sheetData = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as string[][]
    const lastRow = sheetData[sheetData.length - 1]
    expect(lastRow.join('|')).toContain('Total:')
    expect(lastRow.join('|')).toContain('8.00')
  })
})

describe('exportToExcel - rate columns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('produz headers e linhas idênticos ao padrão quando rateColumns não é informado', () => {
    exportToExcel({
      entries: mockEntriesWithRates, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false,
    })
    const sheetData = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as string[][]
    const headers = sheetData[0]
    expect(headers).toEqual(['Data', 'Projeto', 'Fase', 'Subfase', 'Ticket', 'Início', 'Fim', 'Horas', 'Descrição'])
    expect(sheetData[1][7]).toBe('1.00') // coluna Horas usa hours, nao adjustedHours
  })

  it('usa a coluna adjustedHours quando hoursField = adjustedHours', () => {
    exportToExcel({
      entries: mockEntriesWithRates, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false, hoursField: 'adjustedHours',
    })
    const sheetData = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as string[][]
    expect(sheetData[1][7]).toBe('2.00')
    const lastRow = sheetData[sheetData.length - 1]
    expect(lastRow[6]).toBe('Total:')
    expect(lastRow[7]).toBe('2.00') // soma de adjustedHours, nao o totalHours (de hours) recebido via prop
  })

  it('adiciona Total cliente/Total consultor usando valores reais por padrão', () => {
    exportToExcel({
      entries: mockEntriesWithRates, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false, rateColumns: { client: 'real', consultant: 'real' },
    })
    const sheetData = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as string[][]
    const headers = sheetData[0]
    expect(headers).toEqual([
      'Data', 'Projeto', 'Fase', 'Subfase', 'Ticket', 'Início', 'Fim', 'Horas', 'Descrição',
      'Total cliente', 'Total consultor',
    ])
    // hours=1.00, billingRate=120.00 -> total cliente = 120.00; costRate=60.00 -> total consultor = 60.00
    const row = sheetData[1]
    expect(row[9]).toContain('120')
    expect(row[10]).toContain('60')
    const lastRow = sheetData[sheetData.length - 1]
    expect(lastRow[9]).toContain('120')
    expect(lastRow[10]).toContain('60')
  })

  it('usa partnerBillingRate/partnerCostRate quando a fonte é partner', () => {
    exportToExcel({
      entries: mockEntriesWithRates, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false, rateColumns: { client: 'partner', consultant: 'partner' },
    })
    const sheetData = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as string[][]
    // hours=1.00, partnerBillingRate=100.00 -> total cliente = 100.00; partnerCostRate=50.00 -> total consultor = 50.00
    const row = sheetData[1]
    expect(row[9]).toContain('100')
    expect(row[10]).toContain('50')
  })
})

describe('exportToPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates PDF in landscape', async () => {
    await exportToPdf({
      entries: mockEntries, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false,
    })
    // jsPDF was called (verified by save being called)
    expect(mockDoc.save).toHaveBeenCalled()
  })

  it('includes header with logo and period', async () => {
    await exportToPdf({
      entries: mockEntries, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false,
    })
    expect(mockDoc.addImage).toHaveBeenCalled()
  })

  it('reduces fontSize and adds right-aligned columnStyles when rate columns are present', async () => {
    const autoTable = (await import('jspdf-autotable')).default
    await exportToPdf({
      entries: mockEntriesWithRates, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false, rateColumns: { client: 'real', consultant: 'real' },
    })
    const callArgs = vi.mocked(autoTable).mock.calls[0][1] as Record<string, unknown>
    const styles = callArgs.styles as { fontSize: number }
    expect(styles.fontSize).toBe(7)
    const head = callArgs.head as string[][]
    const columnStyles = callArgs.columnStyles as Record<number, { halign: string }>
    const clientTotalIdx = head[0].indexOf('Total cliente')
    expect(columnStyles[clientTotalIdx].halign).toBe('right')
  })

  it('keeps fontSize at 8 when no rate columns are present', async () => {
    const autoTable = (await import('jspdf-autotable')).default
    await exportToPdf({
      entries: mockEntries, totalHours: '1.00', currentMonth: '2024-06',
      showConsultantColumn: false,
    })
    const callArgs = vi.mocked(autoTable).mock.calls[0][1] as Record<string, unknown>
    const styles = callArgs.styles as { fontSize: number }
    expect(styles.fontSize).toBe(8)
  })

  it('adds styled total row', async () => {
    const autoTable = (await import('jspdf-autotable')).default
    await exportToPdf({
      entries: mockEntries, totalHours: '5.00', currentMonth: '2024-06',
      showConsultantColumn: false,
    })
    expect(autoTable).toHaveBeenCalled()
    const callArgs = vi.mocked(autoTable).mock.calls[0][1] as Record<string, unknown>
    const body = callArgs.body as string[][]
    const lastRow = body[body.length - 1]
    expect(lastRow.join('|')).toContain('Total:')
    expect(lastRow.join('|')).toContain('5.00')
  })
})
