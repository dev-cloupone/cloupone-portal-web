export interface AnchorRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const GUTTER = 8;
const MOBILE_BREAKPOINT = 640;
/** Espaco minimo reservado abaixo do topo do painel em telas baixas. */
const MIN_PANEL_SPACE = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calcula a posicao (fixed) do painel de notificacoes a partir do retangulo do
 * sino e das dimensoes da viewport. Funcao pura para ser testavel sem DOM.
 */
export function computeDropdownPosition(
  anchor: AnchorRect,
  viewport: Viewport,
  preferredWidth = 320,
): DropdownPosition {
  // Mobile: painel full-width ancorado abaixo do sino (topbar e drawer).
  if (viewport.width < MOBILE_BREAKPOINT) {
    const top = clamp(anchor.bottom + GUTTER, GUTTER, Math.max(GUTTER, viewport.height - MIN_PANEL_SPACE));
    return {
      top,
      left: GUTTER,
      width: Math.max(0, viewport.width - GUTTER * 2),
      maxHeight: Math.max(0, viewport.height - top - GUTTER),
    };
  }

  const width = Math.min(preferredWidth, Math.max(0, viewport.width - GUTTER * 2));

  // Preferencia: abre a direita do sino (comportamento do mock).
  let left = anchor.right + GUTTER;
  if (left + width + GUTTER > viewport.width) {
    // Nao cabe a direita: tenta abrir a esquerda.
    left = anchor.left - width - GUTTER;
  }
  if (left < GUTTER) {
    left = GUTTER;
  }

  const top = clamp(anchor.top, GUTTER, Math.max(GUTTER, viewport.height - MIN_PANEL_SPACE));

  return {
    top,
    left,
    width,
    maxHeight: Math.max(0, viewport.height - top - GUTTER),
  };
}
