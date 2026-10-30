import type { TableColumn } from './types'

/** First non-summarize column index in a totals row receives the "Total" label. */
export function tableFooterCellKind(
  columns: TableColumn[],
  index: number
): 'summarize' | 'total-label' | 'empty' {
  const col = columns[index]
  if (col.summarize) return 'summarize'
  const firstNonSummarize = columns.findIndex(c => !c.summarize)
  if (index === firstNonSummarize) return 'total-label'
  return 'empty'
}
