// A deliberately small, safe arithmetic evaluator for calculated table
// columns (e.g. "qty * unit_price"). Only column ids from the same row,
// plus numbers and + - * / ( ) . and whitespace, are ever allowed through —
// nothing else reaches Function(), so this can't be used to run arbitrary
// script even though the formula string ultimately comes from form data.

const SAFE_FORMULA = /^[a-zA-Z0-9_+\-*/().\s]*$/

export function evaluateRowFormula(
  formula: string | undefined,
  row: Record<string, string>,
  columnIds: string[]
): number | null {
  if (!formula || !formula.trim()) return null
  if (!SAFE_FORMULA.test(formula)) return null

  try {
    const values = columnIds.map(id => {
      const n = parseFloat(row[id] ?? '')
      return Number.isFinite(n) ? n : 0
    })
    // eslint-disable-next-line no-new-func
    const fn = new Function(...columnIds, `"use strict"; return (${formula});`)
    const result = fn(...values)
    return typeof result === 'number' && Number.isFinite(result) ? result : null
  } catch {
    return null
  }
}

/** Sum a column's values across every row (missing/non-numeric cells count as 0). */
export function sumColumn(rows: Record<string, string>[], columnId: string): number {
  return rows.reduce((total, r) => {
    const n = parseFloat(r[columnId] ?? '')
    return total + (Number.isFinite(n) ? n : 0)
  }, 0)
}

export function formatSum(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2)
}

/** Recompute every calculated column in a single row, given the row's raw edits. */
export function recomputeRow(
  row: Record<string, string>,
  columns: { id: string; type: string; formula?: string }[]
): Record<string, string> {
  let next = { ...row }
  const ids = columns.map(c => c.id)
  for (const col of columns) {
    if (col.type === 'calculated') {
      const result = evaluateRowFormula(col.formula, next, ids)
      next = { ...next, [col.id]: result !== null ? String(Math.round(result * 100) / 100) : '' }
    }
  }
  return next
}
