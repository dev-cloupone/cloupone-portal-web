import { describe, it, expect } from 'vitest'
import { computeDropdownPosition } from '../dropdown-position'

const DESKTOP = { width: 1440, height: 900 }

describe('computeDropdownPosition', () => {
  it('abre a direita quando o sino esta na sidebar expandida', () => {
    // Sino na sidebar de 240px, proximo da borda direita dela
    const anchor = { top: 16, left: 200, right: 224, bottom: 40 }
    const pos = computeDropdownPosition(anchor, DESKTOP)

    expect(pos.left).toBe(232)
    expect(pos.width).toBe(320)
    expect(pos.top).toBe(16)
    expect(pos.left + pos.width).toBeLessThanOrEqual(DESKTOP.width)
  })

  it('abre a direita quando o sino esta na sidebar colapsada', () => {
    const anchor = { top: 60, left: 20, right: 44, bottom: 84 }
    const pos = computeDropdownPosition(anchor, DESKTOP)

    expect(pos.left).toBe(52)
    expect(pos.top).toBe(60)
  })

  it('usa largura full e ancora abaixo do sino no topbar mobile', () => {
    const viewport = { width: 390, height: 844 }
    const anchor = { top: 12, left: 340, right: 374, bottom: 46 }
    const pos = computeDropdownPosition(anchor, viewport)

    expect(pos.left).toBe(8)
    expect(pos.width).toBe(374)
    expect(pos.top).toBe(54)
    expect(pos.left + pos.width).toBeLessThanOrEqual(viewport.width)
  })

  it('faz flip para a esquerda quando o sino esta colado na borda direita', () => {
    const anchor = { top: 10, left: 1380, right: 1420, bottom: 44 }
    const pos = computeDropdownPosition(anchor, DESKTOP)

    expect(pos.left).toBe(1380 - 320 - 8)
    expect(pos.left).toBeGreaterThanOrEqual(8)
    expect(pos.left + pos.width).toBeLessThanOrEqual(DESKTOP.width)
  })

  it('faz clamp no gutter quando nao cabe em nenhum dos lados', () => {
    const viewport = { width: 700, height: 600 }
    const anchor = { top: 10, left: 300, right: 400, bottom: 44 }
    const pos = computeDropdownPosition(anchor, viewport)

    expect(pos.left).toBeGreaterThanOrEqual(8)
    expect(pos.left + pos.width).toBeLessThanOrEqual(viewport.width)
  })

  it('reduz o maxHeight em viewports baixas mantendo top >= 8', () => {
    const viewport = { width: 1280, height: 300 }
    const anchor = { top: 260, left: 200, right: 224, bottom: 290 }
    const pos = computeDropdownPosition(anchor, viewport)

    expect(pos.top).toBeGreaterThanOrEqual(8)
    expect(pos.top).toBe(180) // clamp em height - 120
    expect(pos.maxHeight).toBe(300 - 180 - 8)
    expect(pos.top + pos.maxHeight).toBeLessThanOrEqual(viewport.height)
  })

  it('nunca retorna maxHeight negativo', () => {
    const viewport = { width: 1280, height: 100 }
    const anchor = { top: 90, left: 10, right: 40, bottom: 98 }
    const pos = computeDropdownPosition(anchor, viewport)

    expect(pos.maxHeight).toBeGreaterThanOrEqual(0)
    expect(pos.top).toBeGreaterThanOrEqual(8)
  })
})
