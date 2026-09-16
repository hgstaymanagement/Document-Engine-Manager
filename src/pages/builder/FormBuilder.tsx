import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { FormElement, FieldType, FormVersion, BorderPreset } from '../../lib/types'
import { getPageGeometry, resolveCollision, clampToGrid } from '../../lib/pageGeometry'
import { DEFAULT_PARAGRAPH_STYLE } from '../../lib/paragraphStyle'
import { useAirtableData } from '../../lib/airtableStore'
import { Button, StatusPill } from '../../components/ui'
import DocCanvas from './DocCanvas'
import Inspector from './Inspector'

const PALETTE: { group: string; items: { type: FieldType; label: string }[] }[] = [
  {
    group: 'Basic input',
    items: [
      { type: 'short_text', label: 'Short Text' },
      { type: 'long_text', label: 'Long Text' },
      { type: 'number', label: 'Number' },
      { type: 'currency', label: 'Currency' },
      { type: 'date', label: 'Date' },
      { type: 'time', label: 'Time' },
      { type: 'dropdown', label: 'Dropdown' },
      { type: 'radio', label: 'Radio' },
      { type: 'checkbox', label: 'Checkbox' },
    ],
  },
  {
    group: 'Barangay / official',
    items: [
      { type: 'short_text', label: 'Barangay (database)' },
      { type: 'short_text', label: 'Punong Barangay (database)' },
      { type: 'short_text', label: 'Treasurer (database)' },
      { type: 'short_text', label: 'Secretary (database)' },
    ],
  },
  {
    group: 'Document elements',
    items: [
      { type: 'static_text', label: 'Static Text' },
      { type: 'section_heading', label: 'Section Heading' },
      { type: 'dynamic_text', label: 'Dynamic Text' },
      { type: 'signature', label: 'Signature' },
      { type: 'printed_name', label: 'Printed Name' },
      { type: 'position', label: 'Position' },
      { type: 'date_signed', label: 'Date Signed' },
      { type: 'image', label: 'Image / Logo' },
      { type: 'page_break', label: 'Page Break' },
      { type: 'table', label: 'Table / Repeating Rows' },
    ],
  },
]

let idCounter = 100

export default function FormBuilder() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const isNew = formId === 'new'
  const { getForm, updateForm, createForm, createNewVersion: createNewVersionInStore } = useAirtableData()

  // A brand-new form must exist as a real Airtable record before it has an
  // id, so we create it once on mount and redirect to its real id — every
  // other route (Preview, admin Submissions, etc.) can then rely on the URL
  // id always being a real Form record, instead of reconciling a synthetic
  // client-generated id against Airtable later.
  useEffect(() => {
    if (!isNew) return
    let cancelled = false
    createForm().then(newId => {
      if (!cancelled) navigate(`/admin/forms/${newId}`, { replace: true })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew])

  const form = getForm(formId ?? '')

  const [versionIdx, setVersionIdx] = useState(() => (form ? form.versions.length - 1 : 0))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  if (isNew || !form) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas">
        <p className="text-[13px] text-ink/45">{isNew ? 'Creating form…' : 'Form not found.'}</p>
      </div>
    )
  }

  const activeId = form.id
  // Keep versionIdx in range if the form's version count changes underneath us.
  const safeVersionIdx = Math.min(versionIdx, form.versions.length - 1)
  const version = form.versions[safeVersionIdx]
  const elements = version.elements.filter(e => e.page === page)
  const selected = version.elements.find(e => e.id === selectedId) ?? null

  function updateVersion(mutator: (v: FormVersion) => FormVersion) {
    updateForm(activeId, f => {
      const versions = [...f.versions]
      versions[safeVersionIdx] = mutator(versions[safeVersionIdx])
      return { ...f, versions }
    })
  }

  function addElement(type: FieldType, label: string) {
    const maxY = Math.max(0, ...elements.map(e => e.y + e.h))
    const isDb = label.includes('(database)')
    const w = type === 'section_heading' || type === 'static_text' || type === 'table' || type === 'dynamic_text' ? 12 : 6
    const h = type === 'table' ? 4 : type === 'dynamic_text' ? 2 : 1
    const { maxRows } = getPageGeometry(version.page)
    const placement = resolveCollision(
      { x: 0, y: maxY, w, h },
      elements.map(e => ({ x: e.x, y: e.y, w: e.w, h: e.h })),
      maxRows
    )
    const el: FormElement = {
      id: `el-${idCounter++}`,
      type,
      label: label.replace(' (database)', ''),
      source: isDb ? 'database' : type === 'dynamic_text' ? 'dynamic_text' : 'input',
      x: placement.x,
      y: placement.y,
      w,
      h,
      page,
      databaseField: isDb ? label.replace(' (database)', '').toLowerCase().replace(/\s+/g, '_') : undefined,
      options: type === 'dropdown' || type === 'radio' ? ['Option A', 'Option B'] : undefined,
      columns:
        type === 'table'
          ? [
              { id: 'c1', label: 'Description', width: 6, type: 'short_text' },
              { id: 'c2', label: 'Qty', width: 2, type: 'number', paragraphStyle: { ...DEFAULT_PARAGRAPH_STYLE, align: 'right' } },
              { id: 'c3', label: 'Amount', width: 4, type: 'currency', paragraphStyle: { ...DEFAULT_PARAGRAPH_STYLE, align: 'right' } },
            ]
          : undefined,
      tokens: type === 'dynamic_text' ? [{ type: 'text', value: 'Enter dynamic text…' }] : undefined,
      paragraphStyle:
        type === 'dynamic_text' || type === 'static_text'
          ? { ...DEFAULT_PARAGRAPH_STYLE }
          : type === 'section_heading'
            ? { ...DEFAULT_PARAGRAPH_STYLE, align: 'center' } // headings default to centered, matching prior behavior
            : undefined,
    }
    updateVersion(v => ({ ...v, elements: [...v.elements, el] }))
    setSelectedId(el.id)
  }

  function updateElement(id: string, patch: Partial<FormElement>) {
    updateVersion(v => ({
      ...v,
      elements: v.elements.map(e => {
        if (e.id !== id) return e
        const next = { ...e, ...patch }
        // Keep the element inside the 12-column grid regardless of which
        // property (x or w) changed.
        const clamped = clampToGrid(next)
        next.w = clamped.w
        next.x = clamped.x
        return next
      }),
    }))
  }

  function deleteElement(id: string) {
    updateVersion(v => ({ ...v, elements: v.elements.filter(e => e.id !== id) }))
    setSelectedId(null)
  }

  function setPageLayout(patch: Partial<FormVersion['page']>) {
    updateVersion(v => ({ ...v, page: { ...v.page, ...patch } }))
  }

  async function handleNewVersion() {
    const versionCountBefore = form!.versions.length
    await createNewVersionInStore(activeId)
    setVersionIdx(versionCountBefore)
  }

  return (
    <div className="h-screen flex flex-col bg-canvas">
      {/* Top bar */}
      <div className="h-14 shrink-0 border-b border-line bg-white flex items-center px-5 gap-4">
        <button onClick={() => navigate('/admin/forms')} className="focus-ring text-[13px] text-ink/50 hover:text-ink">
          ← Forms
        </button>
        <input
          value={form.name}
          onChange={e => updateForm(activeId, f => ({ ...f, name: e.target.value }))}
          className="focus-ring text-[14px] font-medium border-none bg-transparent px-1.5 py-1 rounded-sm2 hover:bg-paper w-64"
        />
        <StatusPill status={form.published ? 'published' : 'unpublished'} />

        <div className="ml-auto flex items-center gap-3">
          <select
            value={safeVersionIdx}
            onChange={e => {
              setVersionIdx(Number(e.target.value))
              setSelectedId(null)
            }}
            className="focus-ring text-[12.5px] border border-line rounded-sm2 px-2 py-1.5 bg-white"
          >
            {form.versions.map((v, i) => (
              <option key={v.version} value={i}>
                Version {v.version}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleNewVersion}>
            New version
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/admin/forms/${form.id}/preview`, { state: { versionIdx: safeVersionIdx } })}>
            Preview
          </Button>
          <Button onClick={() => updateForm(activeId, f => ({ ...f, published: !f.published }))}>
            {form.published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Palette */}
        <aside className="w-64 shrink-0 border-r border-line bg-white overflow-y-auto p-4">
          <PageSettings page={version.page} onChange={setPageLayout} />
          <div className="h-px bg-line my-4" />
          {PALETTE.map(group => (
            <div key={group.group} className="mb-5">
              <div className="text-[11px] font-medium text-ink/40 tracking-wide mb-2">{group.group}</div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.label}
                    onClick={() => addElement(item.type, item.label)}
                    className="focus-ring w-full text-left px-2.5 py-1.5 text-[12.5px] rounded-sm2 border border-line2 hover:border-bottle-600 hover:bg-bottle-50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Canvas */}
        <div className="flex-1 overflow-auto py-10 px-6">
          <div className="flex justify-center mb-4">
            <span className="text-[12px] text-ink/50 self-center mr-2">Page</span>
            {[1, 2].map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-sm2 text-[12px] border mx-0.5 ${page === p ? 'bg-bottle-600 text-white border-bottle-600' : 'border-line bg-white hover:bg-paper'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              className="w-7 h-7 rounded-sm2 text-[14px] border border-line bg-white hover:bg-paper text-ink/50 ml-0.5"
              title="Add page"
            >
              +
            </button>
          </div>
          {/* Centered with margin (not flex align-items), since centering an
              oversized child with align-items inside an overflow:auto flex
              container makes the overflow on the far edge unreachable —
              margin-based centering doesn't have that problem. */}
          <div style={{ width: 'max-content', margin: '0 auto' }}>
            <DocCanvas
              pageLayout={version.page}
              elements={elements}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={(id, x, y) => updateElement(id, { x, y })}
            />
          </div>
        </div>

        {/* Inspector */}
        <aside className="w-80 shrink-0 border-l border-line bg-white overflow-y-auto p-5">
          {selected ? (
            <Inspector element={selected} onChange={patch => updateElement(selected.id, patch)} onDelete={() => deleteElement(selected.id)} />
          ) : (
            <div className="text-[12.5px] text-ink/40 pt-4">
              Select an element on the canvas to edit its properties, or add one from the palette on the left.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function PageSettings({
  page,
  onChange,
}: {
  page: FormVersion['page']
  onChange: (p: Partial<FormVersion['page']>) => void
}) {
  function setMargin(side: keyof FormVersion['page']['margins'], value: number) {
    const v = Math.max(0, Math.min(96, Number.isFinite(value) ? value : 0))
    onChange({ margins: { ...page.margins, [side]: v } })
  }

  return (
    <div>
      <div className="text-[11px] font-medium text-ink/40 tracking-wide mb-2">Page layout</div>
      <div className="space-y-2.5">
        <div>
          <label className="block text-[11.5px] text-ink/50 mb-1">Paper size</label>
          <select
            value={page.size}
            onChange={e => onChange({ size: e.target.value as FormVersion['page']['size'] })}
            className="focus-ring w-full border border-line rounded-sm2 px-2 py-1.5 text-[12.5px] bg-white"
          >
            <option>Letter</option>
            <option>A4</option>
            <option>Legal</option>
            <option>Folio</option>
          </select>
        </div>
        <div>
          <label className="block text-[11.5px] text-ink/50 mb-1">Orientation</label>
          <div className="flex border border-line rounded-sm2 overflow-hidden text-[12px]">
            {(['portrait', 'landscape'] as const).map(o => (
              <button
                key={o}
                onClick={() => onChange({ orientation: o })}
                className={`flex-1 py-1.5 capitalize ${page.orientation === o ? 'bg-bottle-600 text-white' : 'bg-white hover:bg-paper'}`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11.5px] text-ink/50 mb-1">Margins (px)</label>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              ['top', 'Top'],
              ['bottom', 'Bottom'],
              ['left', 'Left'],
              ['right', 'Right'],
            ] as const).map(([side, label]) => (
              <label key={side} className="flex items-center gap-1.5">
                <span className="text-[10.5px] text-ink/45 w-9 shrink-0">{label}</span>
                <input
                  type="number"
                  min={0}
                  max={96}
                  value={page.margins[side]}
                  onChange={e => setMargin(side, Number(e.target.value))}
                  className="focus-ring w-full border border-line rounded-sm2 px-1.5 py-1 text-[12px] bg-white"
                />
              </label>
            ))}
          </div>
          <p className="mt-1 text-[10.5px] text-ink/35">
            The dashed rectangle on the canvas marks the printable area for these margins.
          </p>
        </div>
      </div>
    </div>
  )
}

export function borderClass(preset?: BorderPreset) {
  switch (preset) {
    case 'outside':
    case 'all':
    case 'section_box':
      return 'border border-ink/70'
    case 'table_grid':
      return 'border border-ink/70'
    case 'top_bottom':
      return 'border-t border-b border-ink/70'
    case 'bottom_only':
      return 'border-b border-ink/70'
    default:
      return ''
  }
}
