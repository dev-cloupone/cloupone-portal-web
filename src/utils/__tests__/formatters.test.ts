import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from '../formatters'

describe('formatDate', () => {
  it('formats Date to pt-BR pattern (dd/mm/yyyy)', () => {
    const result = formatDate(new Date(2024, 5, 15)) // June 15, 2024
    expect(result).toBe('15/06/2024')
  })

  it('formats ISO string to pt-BR', () => {
    const result = formatDate('2024-01-01T12:00:00')
    expect(result).toBe('01/01/2024')
  })

  it('handles dates at start/end of year', () => {
    const start = formatDate('2024-01-01T12:00:00')
    const end = formatDate('2024-12-31T12:00:00')
    expect(start).toBe('01/01/2024')
    expect(end).toBe('31/12/2024')
  })
})

describe('formatDateTime', () => {
  it('formats Date to pt-BR pattern with time', () => {
    const result = formatDateTime(new Date(2024, 5, 15, 14, 30))
    expect(result).toMatch(/15\/06\/2024.*14:30/)
  })

  it('formats ISO string with time', () => {
    const result = formatDateTime('2024-06-15T14:30:00')
    expect(result).toMatch(/15\/06\/2024.*14:30/)
  })
})
