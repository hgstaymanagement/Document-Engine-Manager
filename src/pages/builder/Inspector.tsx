import { useRef, useState } from 'react'
import type { BorderPreset, FormElement, ParagraphStyle, TableColumn, TableColumnType, TextStyle, DynamicTextToken } from '../../lib/types'
import { DEFAULT_PARAGRAPH_STYLE } from '../../lib/paragraphStyle'
import { DEFAULT_TEXT_STYLE, DEFAULT_BLANK_STYLE, FONT_FAMILIES } from '../../lib/textStyle'
import { DATABASE_FIELDS } from '../../lib/databaseFields'
import { generateId } from '../../lib/uniqueId'
import { Button, Field, inputCls } from '../../components/ui'

const BORDER_PRESETS: { value: BorderPreset; label: string }[] = [
  { value: 'none', label: 'No Border' },
  { value: 'outside', label: 'Outside Border' },
  { value: 'all', label: 'All Borders' },
  { value: 'inside', label: 'Inside Borders' },
  { value: 'top_bottom', label: 'Top & Bottom' },
  { value: 'bottom_only', label: 'Bottom Only' },
  { value: 'section_box', label: 'Section Box' },
  { value: 'table_grid', label: 'Table Grid' },
]

const TABLE_COLUMN_TYPES: { value: TableColumnType; label: string }[] = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'calculated', label: 'Calculated (formula)' },
]

export default function Inspector({
  element,
  fillableFields = [],
  onChange,
  onDelete,
}: {
  element: FormElement
  fillableFields?: FormElement[]
  onChange: (patch: Partial<FormElement>) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium text-ink/40 tracking-wide uppercase">{element.type.replace('_', ' ')}</div>
        <button onClick={onDelete} className="focus-ring text-[12px] text-clay hover:underline">
          Delete
        </button>
      </div>

      <Field label="Label">
        <input className={inputCls} value={element.label} onChange={e => onChange({ label: e.target.value })} />
      </Field>

      <Field label="Source">
        <select
          className={inputCls}
          value={element.source}
          onChange={e => onChange({ source: e.target.value as FormElement['source'] })}
        >
          <option value="input">Form Input</option>
          <option value="database">Database (Airtable)</option>
          <option value="calculated">Calculated</option>
          <option value="dynamic_text">Dynamic Text</option>
        </select>
      </Field>

      {element.source === 'database' && (
        <Field label="Database field" hint="Populated automatically after barangay is selected.">
          <select
            className={inputCls}
            value={element.databaseField ?? ''}
            onChange={e => onChange({ databaseField: e.target.value })}
          >
            {DATABASE_FIELDS.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {element.source === 'calculated' && (
        <Field label="Formula" hint="Reference other fields by their label, e.g. quantity * unit_price">
          <input
            className={`${inputCls} font-mono text-[12px]`}
            value={element.formula ?? ''}
            onChange={e => onChange({ formula: e.target.value })}
            placeholder="quantity * unit_price"
          />
        </Field>
      )}

      {(element.type === 'dropdown' || element.type === 'radio') && (
        <Field label="Options" hint="One per line">
          <textarea
            className={`${inputCls} h-24`}
            value={(element.options ?? []).join('\n')}
            onChange={e => onChange({ options: e.target.value.split('\n') })}
          />
        </Field>
      )}

      {(element.type === 'dynamic_text' || element.type === 'rich_text') && (
        <DynamicTextEditor
          // Forces a fresh component instance (and therefore a fresh
          // textarea) whenever the selected element changes. The textarea
          // below is intentionally uncontrolled (defaultValue + onBlur, so
          // clicking a placeholder button can splice text in at the cursor
          // without fighting a controlled value on every keystroke) — but
          // an uncontrolled input's defaultValue is only ever applied once,
          // at mount. Without this key, switching from one Dynamic Text
          // element to another re-used the same mounted textarea, so it
          // kept showing (and would save back) the PREVIOUS element's text
          // instead of the newly selected one's.
          key={element.id}
          tokens={element.tokens}
          blankStyles={element.blankStyles}
          fillableFields={fillableFields}
          allowBlanks={element.type === 'rich_text'}
          onChange={onChange}
        />
      )}

      {(element.type === 'dynamic_text' || element.type === 'static_text' || element.type === 'section_heading' || element.type === 'rich_text') && (
        <>
          <FontStyleEditor
            style={element.textStyle}
            onChange={patch => onChange({ textStyle: { ...DEFAULT_TEXT_STYLE, ...element.textStyle, ...patch } })}
          />
          <ParagraphStyleEditor
            style={element.paragraphStyle}
            onChange={patch => onChange({ paragraphStyle: { ...DEFAULT_PARAGRAPH_STYLE, ...element.paragraphStyle, ...patch } })}
          />
        </>
      )}

      {element.type === 'table' && (
        <TableColumnsEditor
          columns={element.columns ?? []}
          onChange={columns => onChange({ columns })}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Width (cols)">
          <input
            type="number"
            min={1}
            max={12}
            className={inputCls}
            value={element.w}
            onChange={e => onChange({ w: Number(e.target.value) })}
          />
        </Field>
        <Field label="Height (rows)">
          <input
            type="number"
            min={1}
            className={inputCls}
            value={element.h}
            onChange={e => onChange({ h: Number(e.target.value) })}
          />
        </Field>
      </div>

      <Field label="Required">
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={!!element.required}
            onChange={e => onChange({ required: e.target.checked })}
            className="accent-bottle-600"
          />
          This field must be filled before submitting
        </label>
      </Field>

      <div>
        <span className="block text-[12.5px] text-ink/60 mb-1.5">Border</span>
        <div className="grid grid-cols-2 gap-1.5">
          {BORDER_PRESETS.map(p => (
            <Button
              key={p.value}
              variant={element.border?.preset === p.value ? 'primary' : 'secondary'}
              className="justify-center text-[12px] py-1.5"
              onClick={() =>
                onChange({
                  border: { preset: p.value, thickness: 1, color: '#1C1B17', radius: 0 },
                })
              }
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function tokensToTemplate(tokens?: FormElement['tokens']) {
  if (!tokens) return ''
  return tokens
    .map(t => {
      if (t.type === 'field') return `{{${t.fieldId}}}`
      if (t.type === 'blank') return `[[${t.blankId}::${t.blankLabel ?? ''}]]`
      return t.value
    })
    .join('')
}

function templateToTokens(template: string): DynamicTextToken[] {
  // {{field_id}} references a database/other-form field; [[blank_id::Label]]
  // is a fillable blank embedded right in the paragraph — the client types
  // into it from the fill-form sidebar and the value substitutes back in
  // at this exact spot.
  const parts = template.split(/(\{\{[a-zA-Z0-9_-]+\}\}|\[\[[a-zA-Z0-9_-]+::[^\]]*\]\])/g).filter(Boolean)
  return parts.map(p => {
    const field = p.match(/^\{\{([a-zA-Z0-9_-]+)\}\}$/)
    if (field) return { type: 'field' as const, fieldId: field[1] }
    const blank = p.match(/^\[\[([a-zA-Z0-9_-]+)::([^\]]*)\]\]$/)
    if (blank) return { type: 'blank' as const, blankId: blank[1], blankLabel: blank[2] }
    return { type: 'text' as const, value: p }
  })
}

function DynamicTextEditor({
  tokens,
  blankStyles,
  fillableFields,
  allowBlanks,
  onChange,
}: {
  tokens: DynamicTextToken[] | undefined
  blankStyles: Record<string, TextStyle> | undefined
  fillableFields: FormElement[]
  allowBlanks: boolean
  onChange: (patch: Partial<FormElement>) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function insertMarker(marker: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const newValue = el.value.slice(0, start) + marker + el.value.slice(end)
    el.value = newValue
    onChange({ tokens: templateToTokens(newValue) })
    // Put the cursor right after what was just inserted, so the person can
    // keep typing without having to click back into the textarea.
    const cursor = start + marker.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  function insertField(fieldValue: string) {
    insertMarker(`{{${fieldValue}}}`)
  }

  function insertBlank() {
    const label = window.prompt('Label for this blank (shown to whoever fills out the form):')
    if (!label || !label.trim()) return
    const blankId = generateId('blank')
    insertMarker(`[[${blankId}::${label.trim()}]]`)
    // Seed a default style (underlined, matching the usual "fill in the
    // blank" convention) so it's visibly a blank from the moment it's
    // created, while still being fully adjustable per blank afterward.
    onChange({ blankStyles: { ...blankStyles, [blankId]: { ...DEFAULT_BLANK_STYLE } } })
  }

  function toggleBlankStyle(blankId: string, key: 'bold' | 'italic' | 'underline') {
    const current = blankStyles?.[blankId] ?? DEFAULT_BLANK_STYLE
    onChange({ blankStyles: { ...blankStyles, [blankId]: { ...current, [key]: !current[key] } } })
  }

  return (
    <Field
      label="Text template"
      hint={
        allowBlanks
          ? 'Use {{field_id}} for a field value, or click a field/blank below to insert it.'
          : 'Use {{field_id}} to insert a field value, or click a field below to insert it.'
      }
    >
      <textarea
        ref={textareaRef}
        className={`${inputCls} h-28 font-mono text-[12px]`}
        defaultValue={tokensToTemplate(tokens)}
        onBlur={e => onChange({ tokens: templateToTokens(e.target.value) })}
      />
      {allowBlanks && (
        <div>
          <span className="block text-[10.5px] text-ink/40 mt-2 mb-1">Fillable blanks</span>
          <div className="space-y-1.5">
            {(tokens ?? [])
              .filter(t => t.type === 'blank')
              .map(t => {
                const style = (t.blankId ? blankStyles?.[t.blankId] : undefined) ?? DEFAULT_BLANK_STYLE
                return (
                  <div
                    key={t.blankId}
                    className="flex items-center gap-2 px-2 py-1 rounded-sm2 border border-bottle-600/30 bg-bottle-50"
                  >
                    <span className="text-[11px] text-bottle-700 flex-1 truncate">{t.blankLabel}</span>
                    {(['bold', 'italic', 'underline'] as const).map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => t.blankId && toggleBlankStyle(t.blankId, key)}
                        title={key[0].toUpperCase() + key.slice(1)}
                        className={`w-5 h-5 shrink-0 rounded-sm2 text-[11px] flex items-center justify-center transition-colors ${
                          style[key]
                            ? 'bg-bottle-600 text-white'
                            : 'bg-white text-ink/40 border border-line2 hover:border-bottle-600'
                        } ${key === 'bold' ? 'font-bold' : key === 'italic' ? 'italic' : 'underline'}`}
                      >
                        {key === 'bold' ? 'B' : key === 'italic' ? 'I' : 'U'}
                      </button>
                    ))}
                  </div>
                )
              })}
            <Button variant="secondary" className="py-1" onClick={insertBlank}>
              + Add blank
            </Button>
          </div>
          <p className="mt-1 text-[10.5px] text-ink/35">
            Each blank shows up as its own input in the fill-form sidebar, and whatever's typed
            substitutes back into the paragraph right where you placed it. B/I/U are optional per blank.
          </p>
        </div>
      )}
      <div>
        <span className="block text-[10.5px] text-ink/40 mt-3 mb-1">Database fields</span>
        <div className="flex flex-wrap gap-1.5">
          {DATABASE_FIELDS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => insertField(f.value)}
              title={`Insert {{${f.value}}}`}
              className="focus-ring text-[11px] font-mono px-2 py-1 rounded-sm2 border border-line2 bg-paper hover:border-bottle-600 hover:bg-bottle-50 hover:text-bottle-700 transition-colors"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="block text-[10.5px] text-ink/40 mt-3 mb-1">
          This form's fields{fillableFields.length === 0 && ' (none on page 1 yet)'}
        </span>
        {fillableFields.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {fillableFields.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => insertField(f.id)}
                title={`Insert {{${f.id}}}`}
                className="focus-ring text-[11px] px-2 py-1 rounded-sm2 border border-line2 bg-paper hover:border-bottle-600 hover:bg-bottle-50 hover:text-bottle-700 transition-colors"
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-ink/35">
            Add an input field to page 1 (like Purpose or PR No.) and it'll show up here.
          </p>
        )}
      </div>
    </Field>
  )
}

function TableColumnsEditor({
  columns,
  onChange,
}: {
  columns: TableColumn[]
  onChange: (columns: TableColumn[]) => void
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggleExpanded(i: number) {
    setExpanded(s => {
      const next = new Set(s)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function updateColumn(i: number, patch: Partial<TableColumn>) {
    onChange(columns.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  function removeColumn(i: number) {
    onChange(columns.filter((_, idx) => idx !== i))
  }

  function addColumn() {
    onChange([
      ...columns,
      { id: generateId('c'), label: 'New Column', width: 3, type: 'short_text' },
    ])
  }

  return (
    <div>
      <span className="block text-[12.5px] text-ink/60 mb-1.5">
        Columns <span className="text-ink/35">— each is a real input field for whoever fills this out</span>
      </span>
      <div className="space-y-2.5">
        {columns.map((col, i) => (
          <div key={col.id} className="border border-line rounded-sm2 p-2.5 space-y-2">
            <div className="flex gap-1.5">
              <input
                className={`${inputCls} text-[12.5px] py-1.5`}
                value={col.label}
                onChange={e => updateColumn(i, { label: e.target.value })}
                placeholder="Column label"
              />
              <button
                onClick={() => removeColumn(i)}
                className="focus-ring shrink-0 text-[12px] text-clay px-2 hover:underline"
                title="Remove column"
              >
                ✕
              </button>
            </div>
            <select
              className={`${inputCls} text-[12.5px] py-1.5`}
              value={col.type}
              onChange={e => updateColumn(i, { type: e.target.value as TableColumnType })}
            >
              {TABLE_COLUMN_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {col.type === 'dropdown' && (
              <textarea
                className={`${inputCls} h-16 text-[12px]`}
                placeholder="One option per line"
                value={(col.options ?? []).join('\n')}
                onChange={e => updateColumn(i, { options: e.target.value.split('\n') })}
              />
            )}
            {col.type === 'calculated' && (
              <div>
                <input
                  className={`${inputCls} font-mono text-[12px] py-1.5`}
                  placeholder="e.g. qty * unit_price"
                  value={col.formula ?? ''}
                  onChange={e => updateColumn(i, { formula: e.target.value })}
                />
                <p className="mt-1 text-[10.5px] text-ink/40">
                  Reference other columns by id:{' '}
                  {columns
                    .filter((_, idx) => idx !== i)
                    .map(c => c.id)
                    .join(', ') || 'add other columns first'}
                  . Recalculated automatically as each row is filled in.
                </p>
              </div>
            )}
            {(col.type === 'number' || col.type === 'currency' || col.type === 'calculated') && (
              <label className="flex items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={!!col.summarize}
                  onChange={e => updateColumn(i, { summarize: e.target.checked })}
                  className="accent-bottle-600"
                />
                Include in totals row (sums this column across all rows)
              </label>
            )}
            <div>
              <button
                onClick={() => toggleExpanded(i)}
                className="focus-ring text-[11px] text-bottle-600 hover:underline"
              >
                {expanded.has(i) ? '▾' : '▸'} Text formatting
              </button>
              {expanded.has(i) && (
                <div className="mt-2 space-y-2.5">
                  <FontStyleEditor
                    style={col.textStyle}
                    onChange={patch => updateColumn(i, { textStyle: { ...DEFAULT_TEXT_STYLE, ...col.textStyle, ...patch } })}
                  />
                  <ParagraphStyleEditor
                    style={col.paragraphStyle}
                    onChange={patch =>
                      updateColumn(i, { paragraphStyle: { ...DEFAULT_PARAGRAPH_STYLE, ...col.paragraphStyle, ...patch } })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        <Button variant="secondary" className="w-full justify-center" onClick={addColumn}>
          + Add column
        </Button>
      </div>
    </div>
  )
}

const ALIGN_OPTIONS: { value: ParagraphStyle['align']; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' },
]

const LIST_OPTIONS: { value: ParagraphStyle['listType']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'bullet', label: 'Bullet' },
  { value: 'numbered', label: 'Numbered' },
]

const LINE_HEIGHT_OPTIONS = [1, 1.15, 1.4, 1.5, 2]

function FontStyleEditor({
  style,
  onChange,
}: {
  style: TextStyle | undefined
  onChange: (patch: Partial<TextStyle>) => void
}) {
  // Deliberately reads from the raw `style` prop (not a defaulted fallback)
  // for the "not customized yet" hint, but still shows sensible values in
  // the controls themselves so the person isn't staring at a blank picker.
  const s = style ?? DEFAULT_TEXT_STYLE

  return (
    <div>
      <span className="block text-[12.5px] text-ink/60 mb-1.5">
        Font {!style && <span className="text-ink/35">— using the form's default</span>}
      </span>
      <div className="grid grid-cols-2 gap-2.5 border border-line rounded-sm2 p-3">
        <div className="col-span-2">
          <label className="block text-[11.5px] text-ink/50 mb-1">Typeface</label>
          <select
            value={s.fontFamily}
            onChange={e => onChange({ fontFamily: e.target.value })}
            className="focus-ring w-full border border-line rounded-sm2 px-2 py-1.5 text-[12.5px] bg-white"
          >
            {FONT_FAMILIES.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11.5px] text-ink/50 mb-1">Size (px)</label>
          <input
            type="number"
            min={6}
            max={72}
            value={s.fontSize}
            onChange={e => onChange({ fontSize: Math.max(6, Math.min(72, Number(e.target.value))) })}
            className="focus-ring w-full border border-line rounded-sm2 px-2 py-1.5 text-[12.5px] bg-white"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[11.5px] text-ink/50 mb-1">Style</label>
          <div className="flex border border-line rounded-sm2 overflow-hidden text-[12.5px]">
            <button
              type="button"
              onClick={() => onChange({ bold: !s.bold })}
              className={`flex-1 py-1.5 font-bold ${s.bold ? 'bg-bottle-600 text-white' : 'bg-white hover:bg-paper'}`}
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => onChange({ italic: !s.italic })}
              className={`flex-1 py-1.5 italic ${s.italic ? 'bg-bottle-600 text-white' : 'bg-white hover:bg-paper'}`}
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => onChange({ underline: !s.underline })}
              className={`flex-1 py-1.5 underline ${s.underline ? 'bg-bottle-600 text-white' : 'bg-white hover:bg-paper'}`}
              title="Underline"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => onChange({ strikethrough: !s.strikethrough })}
              className={`flex-1 py-1.5 line-through ${s.strikethrough ? 'bg-bottle-600 text-white' : 'bg-white hover:bg-paper'}`}
              title="Strikethrough"
            >
              S
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ParagraphStyleEditor({
  style,
  onChange,
}: {
  style: ParagraphStyle | undefined
  onChange: (patch: Partial<ParagraphStyle>) => void
}) {
  const s = style ?? DEFAULT_PARAGRAPH_STYLE

  return (
    <div>
      <span className="block text-[12.5px] text-ink/60 mb-1.5">Paragraph</span>
      <div className="space-y-2.5 border border-line rounded-sm2 p-3">
        <div>
          <label className="block text-[11.5px] text-ink/50 mb-1">Alignment</label>
          <div className="flex border border-line rounded-sm2 overflow-hidden text-[11.5px]">
            {ALIGN_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => onChange({ align: o.value })}
                className={`flex-1 py-1.5 ${s.align === o.value ? 'bg-bottle-600 text-white' : 'bg-white hover:bg-paper'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11.5px] text-ink/50 mb-1">List / numbering</label>
          <div className="flex border border-line rounded-sm2 overflow-hidden text-[11.5px]">
            {LIST_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => onChange({ listType: o.value })}
                className={`flex-1 py-1.5 ${s.listType === o.value ? 'bg-bottle-600 text-white' : 'bg-white hover:bg-paper'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11.5px] text-ink/50 mb-1">Indent (px)</label>
            <input
              type="number"
              min={0}
              max={120}
              value={s.indent}
              onChange={e => onChange({ indent: Math.max(0, Number(e.target.value)) })}
              className="focus-ring w-full border border-line rounded-sm2 px-2 py-1.5 text-[12.5px] bg-white"
            />
          </div>
          <div>
            <label className="block text-[11.5px] text-ink/50 mb-1">Line height</label>
            <select
              value={s.lineHeight}
              onChange={e => onChange({ lineHeight: Number(e.target.value) })}
              className="focus-ring w-full border border-line rounded-sm2 px-2 py-1.5 text-[12.5px] bg-white"
            >
              {LINE_HEIGHT_OPTIONS.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[12.5px]">
          <input
            type="checkbox"
            checked={s.hyphenate}
            onChange={e => onChange({ hyphenate: e.target.checked })}
            className="accent-bottle-600"
          />
          Hyphenate long words when justified
        </label>
      </div>
    </div>
  )
}
