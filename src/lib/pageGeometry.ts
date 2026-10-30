import type { FormElement, FormVersion } from './types'

export const PAGE_SIZES: Record<FormVersion['page']['size'], [number, number]> = {
  Letter: [816, 1056],
  A4: [794, 1123],
  Legal: [816, 1344],
  Folio: [816, 1248],
}

// Grid constants — a single definition shared everywhere so the builder
// canvas and the print/PDF renderer can never disagree on units again.
export const ROW_H = 28
export const COLS = 12

export interface PageGeometry {
  /** Full page width in px, at 96dpi, portrait/landscape applied. */
  pageW: number
  /** Full page height in px. */
  pageH: number
  /** Printable width (page width minus left/right margins). */
  contentW: number
  /** Printable height (page height minus top/bottom margins). */
  contentH: number
  /** Width of one grid column, derived from contentW / COLS. */
  colW: number
  /** Number of whole rows that fit within contentH. */
  maxRows: number
}

export function getPageGeometry(page: FormVersion['page']): PageGeometry {
  let [pageW, pageH] = PAGE_SIZES[page.size]
  if (page.orientation === 'landscape') [pageW, pageH] = [pageH, pageW]

  const contentW = pageW - page.margins.left - page.margins.right
  const contentH = pageH - page.margins.top - page.margins.bottom
  const colW = contentW / COLS
  const maxRows = Math.max(0, Math.floor(contentH / ROW_H))

  return { pageW, pageH, contentW, contentH, colW, maxRows }
}

/** Axis-aligned bounding-box overlap test in grid units (columns/rows). */
export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * Given a candidate placement for `moving`, resolve any overlap against
 * `others` by sliding the element straight down to the next free row.
 * Clamped so it never lands past the page's usable row count.
 */
export function resolveCollision(
  moving: { x: number; y: number; w: number; h: number },
  others: { x: number; y: number; w: number; h: number }[],
  maxRows: number
) {
  const maxY = Math.max(0, maxRows - moving.h)
  let y = Math.max(0, Math.min(moving.y, maxY))
  // Walk down one row at a time until a fully free spot is found or we hit
  // the bottom of the page. Bounded by maxY (not by others.length) so a
  // single tall obstacle (e.g. a 6-row table) is correctly cleared.
  while (y <= maxY) {
    const candidate = { ...moving, y }
    const collides = others.some(o => rectsOverlap(candidate, o))
    if (!collides) return candidate
    y += 1
  }
  return { ...moving, y: maxY }
}

export function clampToGrid(el: Pick<FormElement, 'x' | 'w'>) {
  const w = Math.min(COLS, Math.max(1, el.w))
  const x = Math.min(COLS - w, Math.max(0, el.x))
  return { x, w }
}
