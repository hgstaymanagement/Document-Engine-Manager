import { useRef, useState } from 'react'
import type { FormElement, FormVersion } from '../../lib/types'
import { getPageGeometry, ROW_H, COLS, resolveCollision } from '../../lib/pageGeometry'
import { textAndParagraphCss } from '../../lib/textStyle'
import { borderClass } from './FormBuilder'

export default function DocCanvas({
  pageLayout,
  elements,
  selectedId,
  onSelect,
  onMove,
}: {
  pageLayout: FormVersion['page']
  elements: FormElement[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  // Ghost position while actively dragging — not committed to real state
  // until pointer-up, so overlap resolution only ever happens once, on drop.
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)

  const { pageW, pageH, contentW, contentH, colW, maxRows } = getPageGeometry(pageLayout)

  function handlePointerDown(e: React.PointerEvent, el: FormElement) {
    e.stopPropagation()
    onSelect(el.id)
    setDragId(el.id)
    setGhost({ x: el.x, y: el.y })
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragId || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = e.clientX - rect.left - pageLayout.margins.left
    const relY = e.clientY - rect.top - pageLayout.margins.top
    const el = elements.find(el => el.id === dragId)
    if (!el) return
    const maxX = Math.max(0, COLS - el.w)
    const maxY = Math.max(0, maxRows - el.h)
    const newX = Math.max(0, Math.min(maxX, Math.round(relX / colW - el.w / 2)))
    const newY = Math.max(0, Math.min(maxY, Math.round(relY / ROW_H - el.h / 2)))
    setGhost({ x: newX, y: newY })
  }

  function handlePointerUp() {
    if (dragId && ghost) {
      const el = elements.find(el => el.id === dragId)
      if (el) {
        const resolved = resolveCollision(
          { x: ghost.x, y: ghost.y, w: el.w, h: el.h },
          elements.filter(o => o.id !== dragId).map(o => ({ x: o.x, y: o.y, w: o.w, h: o.h })),
          maxRows
        )
        onMove(dragId, resolved.x, resolved.y)
      }
    }
    setDragId(null)
    setGhost(null)
  }

  const draggedEl = dragId ? elements.find(el => el.id === dragId) : null
  const overlapsAtGhost =
    draggedEl && ghost
      ? elements
          .filter(o => o.id !== dragId)
          .some(o => ghost.x < o.x + o.w && ghost.x + draggedEl.w > o.x && ghost.y < o.y + o.h && ghost.y + draggedEl.h > o.y)
      : false

  // Repeating background grid confined to the printable area, so the grid
  // itself always matches whatever the margins/columns actually are.
  // Kept invisible by default — snapping still applies, it's just not drawn.

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={e => {
        if (e.target === e.currentTarget) onSelect(null)
      }}
      className="relative bg-white shadow-doc"
      style={{ width: pageW, height: pageH }}
    >
      {/* Margin guide — dashed rectangle marking the exact printable area */}
      <div
        className="absolute border border-dashed border-bottle-600/35 pointer-events-none"
        style={{ left: pageLayout.margins.left, top: pageLayout.margins.top, width: contentW, height: contentH }}
      />

      <div
        className="relative w-full h-full font-serif text-ink"
        onClick={e => {
          if (e.target === e.currentTarget) onSelect(null)
        }}
      >
        {elements.map(el => {
          const isDragging = el.id === dragId
          const pos = isDragging && ghost ? ghost : { x: el.x, y: el.y }
          return (
            <ElementBlock
              key={el.id}
              el={el}
              x={pos.x}
              y={pos.y}
              colW={colW}
              marginLeft={pageLayout.margins.left}
              marginTop={pageLayout.margins.top}
              selected={el.id === selectedId}
              dragging={isDragging}
              invalid={isDragging && overlapsAtGhost}
              onPointerDown={e => handlePointerDown(e, el)}
            />
          )
        })}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-ink/25 text-[13px] font-sans">
            Add elements from the palette to begin building this page
          </div>
        )}
      </div>

      {elements.some(el => (el.y + el.h) * ROW_H > contentH) && (
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: pageLayout.margins.top + contentH }}>
          <div className="border-t-2 border-dashed border-clay/60" />
          <div className="absolute -top-5 right-0 text-[10.5px] font-sans text-clay bg-white/90 px-1.5 rounded-sm2">
            content exceeds page — move to a new page
          </div>
        </div>
      )}
    </div>
  )
}

function ElementBlock({
  el,
  x,
  y,
  colW,
  marginLeft,
  marginTop,
  selected,
  dragging,
  invalid,
  onPointerDown,
}: {
  el: FormElement
  x: number
  y: number
  colW: number
  marginLeft: number
  marginTop: number
  selected: boolean
  dragging: boolean
  invalid: boolean
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: marginLeft + x * colW,
    top: marginTop + y * ROW_H,
    width: el.w * colW,
    minHeight: el.h * ROW_H,
    zIndex: dragging ? 20 : undefined,
    opacity: dragging ? 0.85 : 1,
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={e => e.stopPropagation()}
      style={style}
      className={`px-1.5 py-1 cursor-move select-none bg-white ${
        invalid
          ? 'ring-2 ring-clay'
          : selected
            ? 'ring-2 ring-bottle-600 ring-offset-1'
            : 'hover:ring-1 hover:ring-line'
      } ${borderClass(el.border?.preset)}`}
    >
      <ElementContent el={el} />
    </div>
  )
}

function ElementContent({ el }: { el: FormElement }) {
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
        <p className="text-[12.5px] text-ink/80" style={textAndParagraphCss(el.paragraphStyle, el.textStyle)} lang="en">
          {el.tokens?.map((t, i) =>
            t.type === 'text' ? (
              <span key={i}>{t.value}</span>
            ) : (
              <span key={i} className="font-medium text-bottle-700">
                {`{{${t.fieldId}}}`}
              </span>
            )
          )}
        </p>
      )
    case 'table': {
      const cols = el.columns ?? []
      const summarizeCols = cols.filter(c => c.summarize)
      let labelPlaced = false
      return (
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.id} className="border border-ink/60 px-1.5 py-1 font-medium bg-paper" style={{ width: `${(c.width / 12) * 100}%` }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1].map(r => (
              <tr key={r}>
                {cols.map(c => (
                  <td key={c.id} className="border border-ink/40 px-1.5 py-2.5" style={textAndParagraphCss(c.paragraphStyle, c.textStyle)}>
                    &nbsp;
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
                      <td key={c.id} className="border border-ink/60 px-1.5 py-1.5 font-semibold bg-paper text-right text-ink/40">
                        0.00
                      </td>
                    )
                  }
                  if (!labelPlaced) {
                    labelPlaced = true
                    return (
                      <td key={c.id} className="border border-ink/60 px-1.5 py-1.5 font-semibold bg-paper text-right text-ink/40">
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
          <div className="font-medium">{el.source === 'database' ? `{{${el.databaseField}}}` : '\u00A0'}</div>
          <div className="text-ink/50 mt-0.5">{el.label}</div>
        </div>
      )
    case 'page_break':
      return <div className="border-t border-dashed border-ink/30 text-[10px] text-ink/30 text-center -mt-1.5">page break</div>
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-[12.5px]">
          <span className="w-3.5 h-3.5 border border-ink/50 inline-block shrink-0" />
          {el.label}
        </label>
      )
    case 'dropdown':
    case 'radio':
      return (
        <div>
          <div className="text-[11px] text-ink/50 mb-0.5">{el.label}{el.source === 'database' && <span className="text-bottle-600"> · db</span>}</div>
          <div className="border-b border-ink/50 text-[12.5px] text-ink/40 pb-0.5">{el.options?.join(' / ')}</div>
        </div>
      )
    default:
      return (
        <div>
          <div className="text-[11px] text-ink/50 mb-0.5">
            {el.label}
            {el.source === 'database' && <span className="text-bottle-600"> · db</span>}
            {el.source === 'calculated' && <span className="text-brass-600"> · calc</span>}
          </div>
          <div className="border-b border-ink/50 h-4" />
        </div>
      )
  }
}
