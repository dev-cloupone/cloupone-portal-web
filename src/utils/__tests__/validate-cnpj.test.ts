import { describe, it, expect } from 'vitest'
import { validateCnpj } from '../validate-cnpj'

describe('validateCnpj', () => {
  it('returns true for valid formatted CNPJ', () => {
    expect(validateCnpj('11.222.333/0001-81')).toBe(true)
  })

  it('returns true for valid unformatted CNPJ', () => {
    expect(validateCnpj('11222333000181')).toBe(true)
  })

  it('returns false for CNPJ with all equal digits', () => {
    expect(validateCnpj('11111111111111')).toBe(false)
    expect(validateCnpj('00000000000000')).toBe(false)
  })

  it('returns false for short CNPJ', () => {
    expect(validateCnpj('1122233300018')).toBe(false)
  })

  it('returns false for invalid first check digit', () => {
    expect(validateCnpj('11222333000191')).toBe(false)
  })

  it('returns false for invalid second check digit', () => {
    expect(validateCnpj('11222333000182')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(validateCnpj('')).toBe(false)
  })
})
