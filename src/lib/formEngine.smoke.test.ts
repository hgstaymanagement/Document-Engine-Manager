import { describe, expect, it } from 'vitest'
import { resolveCollision, rectsOverlap, clampToGrid, getPageGeometry, COLS } from './pageGeometry'
import { evaluateRowFormula, recomputeRow, sumColumn, formatSum } from './formula'
import { splitTokensIntoParagraphs } from './dynamicTextParagraphs'
import { resolveDatabaseFieldFromPalette } from './databaseFields'
import { getFillableInputElements } from './formFields'
import { tableFooterCellKind } from './tableFooter'
import type { FormElement } from './types'

describe('pageGeometry', () => {
  const page = { size: 'Letter' as const, orientation: 'portrait' as const, margins: { top: 48, right: 48, bottom: 48, left: 48 } }

  it('computes consistent grid units', () => {
    const g = getPageGeometry(page)
    expect(g.colW).toBeCloseTo(g.contentW / COLS)
    expect(g.maxRows).toBe(Math.floor(g.contentH / 28))
  })

  it('detects overlapping rects', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 6, h: 1 }, { x: 5, y: 0, w: 6, h: 1 })).toBe(true)
    expect(rectsOverlap({ x: 0, y: 0, w: 3, h: 1 }, { x: 4, y: 0, w: 3, h: 1 })).toBe(false)
  })

  it('slides colliding elements downward', () => {
    const others = [{ x: 0, y: 2, w: 12, h: 4 }]
    const resolved = resolveCollision({ x: 0, y: 2, w: 6, h: 1 }, others, 20)
    expect(resolved.y).toBe(6)
  })

  it('clamps width to the 12-column grid', () => {
    expect(clampToGrid({ x: 10, w: 5 })).toEqual({ x: 7, w: 5 })
  })
})

describe('formula engine', () => {
  const columns = [
    { id: 'qty', type: 'number' },
    { id: 'price', type: 'number' },
    { id: 'amount', type: 'calculated', formula: 'qty * price' },
  ]

  it('evaluates row formulas using column ids', () => {
    const row = { qty: '2', price: '100', amount: '' }
    const next = recomputeRow(row, columns)
    expect(next.amount).toBe('200')
  })

  it('respects MDAS precedence', () => {
    const result = evaluateRowFormula('a + b * c', { a: '1', b: '2', c: '3' }, ['a', 'b', 'c'])
    expect(result).toBe(7)
  })

  it('rejects unsafe formula characters', () => {
    expect(evaluateRowFormula('alert(1)', {}, [])).toBeNull()
  })

  it('sums and formats currency columns', () => {
    const rows = [{ amt: '10.5' }, { amt: '2' }, { amt: 'x' }]
    expect(formatSum(sumColumn(rows, 'amt'))).toBe('12.50')
  })
})

describe('dynamic text', () => {
  it('splits paragraphs on blank lines', () => {
    const paragraphs = splitTokensIntoParagraphs([
      { type: 'text', value: 'Line one\n\nLine two' },
      { type: 'field', fieldId: 'applicant' },
    ])
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[1][0]).toEqual({ type: 'field', fieldId: 'applicant' })
  })
})

describe('database palette mapping', () => {
  it('maps barangay palette label to barangay_name', () => {
    expect(resolveDatabaseFieldFromPalette('Barangay (database)')).toBe('barangay_name')
    expect(resolveDatabaseFieldFromPalette('Punong Barangay (database)')).toBe('punong_barangay')
  })
})

describe('fillable fields', () => {
  it('only includes page-1 input elements', () => {
    const elements: FormElement[] = [
      { id: 'a', type: 'short_text', label: 'Purpose', source: 'input', x: 0, y: 0, w: 6, h: 1, page: 1 },
      { id: 'b', type: 'short_text', label: 'Other', source: 'input', x: 0, y: 1, w: 6, h: 1, page: 2 },
      { id: 'c', type: 'short_text', label: 'Barangay', source: 'database', x: 0, y: 2, w: 6, h: 1, page: 1, databaseField: 'barangay_name' },
    ]
    expect(getFillableInputElements(elements).map(e => e.id)).toEqual(['a'])
  })
})

describe('table footer', () => {
  const columns = [
    { id: 'c1', label: 'Item', width: 6, type: 'short_text' as const },
    { id: 'c2', label: 'Qty', width: 2, type: 'number' as const },
    { id: 'c3', label: 'Amount', width: 4, type: 'currency' as const, summarize: true },
  ]

  it('places total label in the first non-summarize column', () => {
    expect(tableFooterCellKind(columns, 0)).toBe('total-label')
    expect(tableFooterCellKind(columns, 1)).toBe('empty')
    expect(tableFooterCellKind(columns, 2)).toBe('summarize')
  })
})
