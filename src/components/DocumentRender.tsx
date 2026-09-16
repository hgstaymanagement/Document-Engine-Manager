import type { FormElement, FormVersion } from '../lib/types'
import { getPageGeometry, ROW_H } from '../lib/pageGeometry'
import { textAndParagraphCss } from '../lib/textStyle'
import { sumColumn, formatSum } from '../lib/formula'
import { borderClass } from '../pages/builder/FormBuilder'

export interface RenderData {
  [key: string]: string | number | boolean | undefined
}

export default function DocumentRender({
  pageLayout,
  elements,
  data,
  tableRows,
}: {
  pageLayout: FormVersion['page']
  elements: FormElement[]
  data: RenderData
  tableRows?: Record<string, Record<string, string>[]>
}) {
  const { pageW, pageH, colW } = getPageGeometry(pageLayout)

  const pages = Array.from(new Set(elements.map(e => e.page))).sort()

  return (
    <>
      <style>{`@page { size: ${pageW}px ${pageH}px; margin: 0; }`}</style>
      {pages.map(p => (
        <div
          key={p}
          className="relative bg-white shadow-doc mx-auto mb-8 print:shadow-none print:mb-0 print:break-after-page"
          style={{ width: pageW, minHeight: pageH }}
        >
          {elements
            .filter(e => e.page === p)
            .map(el => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: pageLayout.margins.left + el.x * colW,
                  top: pageLayout.margins.top + el.y * ROW_H,
                  width: el.w * colW,
                  minHeight: el.h * ROW_H,
                }}
                className={`px-1.5 py-1 break-inside-avoid font-serif text-ink ${borderClass(el.border?.preset)}`}
              >
                <FilledContent el={el} data={data} rows={tableRows?.[el.id]} />
              </div>
            ))}
        </div>
      ))}
    </>
  )
}

function resolveValue(el: FormElement, data: RenderData) {
  const key = el.databaseField ?? el.id
  return data[key]
}

function FilledContent({ el, data, rows }: { el: FormElement; data: RenderData; rows?: Record<string, string>[] }) {
  switch (el.type) {
    case 'static_text':
      return (
        <p className="text-[13px] leading-snug" style={textAndParagraphCss(el.paragraphStyle, el.textStyle)} lang="en">
          {el.label}
        </p>
      )
    case 'section_heading':
      return (
        <h3 className="text-[15px] font-semibold tracking-tight" style={textAndParagraphCss(el.paragraphStyle, el.textStyle)} lang="en">
          {el.label}
        </h3>
      )
    case 'dynamic_text':
      return (
        <p className="text-[12.5px]" style={textAndParagraphCss(el.paragraphStyle, el.textStyle)} lang="en">
          {el.tokens?.map((t, i) =>
            t.type === 'text' ? <span key={i}>{t.value}</span> : <span key={i}>{data[t.fieldId ?? ''] ?? `{{${t.fieldId}}}`}</span>
          )}
        </p>
      )
    case 'table': {
      const cols = el.columns ?? []
      const dataRows = rows && rows.length ? rows : []
      const summarizeCols = cols.filter(c => c.summarize)
      let labelPlaced = false

      return (
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.id} className="border border-ink/60 px-1.5 py-1 font-medium bg-paper">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows && rows.length ? rows : [{}, {}]).map((r, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c.id} className="border border-ink/40 px-1.5 py-1.5 h-6 align-top" style={textAndParagraphCss(c.paragraphStyle, c.textStyle)}>
                    {r[c.id] ?? '\u00A0'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {summarizeCols.length > 0 && (
            <tfoot>
              <tr>
                {cols.map(c => {
                  if (c.summarize) {
                    return (
                      <td key={c.id} className="border border-ink/60 px-1.5 py-1.5 font-semibold bg-paper text-right">
                        {formatSum(sumColumn(dataRows, c.id))}
                      </td>
                    )
                  }
                  if (!labelPlaced) {
                    labelPlaced = true
                    return (
                      <td key={c.id} className="border border-ink/60 px-1.5 py-1.5 font-semibold bg-paper text-right">
                        Total
                      </td>
                    )
                  }
                  return <td key={c.id} className="border border-ink/60 px-1.5 py-1.5 bg-paper" />
                })}
              </tr>
            </tfoot>
          )}
        </table>
      )
    }
    case 'signature':
      return (
        <div className="text-center text-[11.5px] pt-6">
          <div className="font-medium">{String(resolveValue(el, data) ?? '\u00A0')}</div>
          <div className="border-t border-ink/60 mt-1 pt-1 text-ink/60">{el.label}</div>
        </div>
      )
    case 'page_break':
      return null
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-[12.5px]">
          <span className="w-3.5 h-3.5 border border-ink/50 inline-flex items-center justify-center text-[10px]">
            {resolveValue(el, data) ? '✓' : ''}
          </span>
          {el.label}
        </label>
      )
    default:
      return (
        <div>
          <div className="text-[10.5px] text-ink/50 mb-0.5">{el.label}</div>
          <div className="border-b border-ink/50 text-[12.5px] pb-0.5 min-h-[16px]">
            {String(resolveValue(el, data) ?? '')}
          </div>
        </div>
      )
  }
}
