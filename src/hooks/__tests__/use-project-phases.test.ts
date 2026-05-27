import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { mockListPhases, mockCreatePhase, mockUpdatePhase, mockDeactivatePhase, mockReorderPhases,
  mockCreateSubphase, mockUpdateSubphase, mockDeactivateSubphase, mockUpdateSubphaseStatus,
  mockAddConsultant, mockRemoveConsultant, mockUpdateConsultantHours, mockLoadConsultants,
  mockClonePhases, mockAddToast, mockFormatApiError } = vi.hoisted(() => ({
  mockListPhases: vi.fn(),
  mockCreatePhase: vi.fn(),
  mockUpdatePhase: vi.fn(),
  mockDeactivatePhase: vi.fn(),
  mockReorderPhases: vi.fn(),
  mockCreateSubphase: vi.fn(),
  mockUpdateSubphase: vi.fn(),
  mockDeactivateSubphase: vi.fn(),
  mockUpdateSubphaseStatus: vi.fn(),
  mockAddConsultant: vi.fn(),
  mockRemoveConsultant: vi.fn(),
  mockUpdateConsultantHours: vi.fn(),
  mockLoadConsultants: vi.fn(),
  mockClonePhases: vi.fn(),
  mockAddToast: vi.fn(),
  mockFormatApiError: vi.fn().mockReturnValue('error'),
}))

vi.mock('../../services/phase.service', () => ({
  listPhases: mockListPhases,
  createPhase: mockCreatePhase,
  updatePhase: mockUpdatePhase,
  deactivatePhase: mockDeactivatePhase,
  reorderPhases: mockReorderPhases,
  createSubphase: mockCreateSubphase,
  updateSubphase: mockUpdateSubphase,
  deactivateSubphase: mockDeactivateSubphase,
  updateSubphaseStatus: mockUpdateSubphaseStatus,
  addConsultant: mockAddConsultant,
  removeConsultant: mockRemoveConsultant,
  updateConsultantHours: mockUpdateConsultantHours,
  loadConsultants: mockLoadConsultants,
  clonePhases: mockClonePhases,
}))

vi.mock('../../services/api', () => ({
  formatApiError: mockFormatApiError,
}))

vi.mock('../../stores/toast.store', () => ({
  useToastStore: vi.fn((selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast })
  ),
}))

import { useProjectPhases } from '../use-project-phases'

describe('useProjectPhases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListPhases.mockResolvedValue({ data: [] })
  })

  describe('loading', () => {
    it('loads project phases when calling loadPhases', async () => {
      mockListPhases.mockResolvedValue({ data: [{ id: 'p1', name: 'Phase 1' }] })
      const { result } = renderHook(() => useProjectPhases('proj1'))
      await act(async () => {
        await result.current.loadPhases()
      })
      expect(mockListPhases).toHaveBeenCalledWith('proj1')
      expect(result.current.phases).toHaveLength(1)
    })
  })

  describe('phase CRUD', () => {
    it('createPhase creates and reloads', async () => {
      mockCreatePhase.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectPhases('proj1'))
      await act(async () => {
        await result.current.createPhase({ name: 'New Phase' } as never)
      })
      expect(mockCreatePhase).toHaveBeenCalledWith('proj1', { name: 'New Phase' })
      expect(mockAddToast).toHaveBeenCalledWith('Fase criada com sucesso', 'success')
    })

    it('updatePhase updates and reloads', async () => {
      mockUpdatePhase.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectPhases('proj1'))
      await act(async () => {
        await result.current.updatePhase('ph1', { name: 'Updated' } as never)
      })
      expect(mockUpdatePhase).toHaveBeenCalledWith('ph1', { name: 'Updated' })
    })

    it('deletePhase deletes and reloads', async () => {
      mockDeactivatePhase.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectPhases('proj1'))
      await act(async () => {
        await result.current.deletePhase('ph1')
      })
      expect(mockDeactivatePhase).toHaveBeenCalledWith('ph1')
    })

    it('reorderPhases reorders and reloads', async () => {
      mockReorderPhases.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectPhases('proj1'))
      await act(async () => {
        await result.current.reorderPhases(['ph1', 'ph2'])
      })
      expect(mockReorderPhases).toHaveBeenCalledWith('proj1', ['ph1', 'ph2'])
    })
  })

  describe('subphase CRUD', () => {
    it('createSubphase creates and reloads', async () => {
      mockCreateSubphase.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectPhases('proj1'))
      await act(async () => {
        await result.current.createSubphase('ph1', { name: 'Sub1' } as never)
      })
      expect(mockCreateSubphase).toHaveBeenCalledWith('ph1', { name: 'Sub1' })
    })
  })

  describe('errors', () => {
    it('shows error toast on failure', async () => {
      mockListPhases.mockRejectedValue(new Error('fail'))
      const { result } = renderHook(() => useProjectPhases('proj1'))
      await act(async () => {
        await result.current.loadPhases()
      })
      expect(mockAddToast).toHaveBeenCalledWith('error', 'error')
    })
  })
})
