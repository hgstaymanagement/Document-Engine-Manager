import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAirtableData } from '../lib/airtableStore'
import { useAuth } from '../lib/auth'
import type { FormElement, Submission, TableColumn } from '../lib/types'
import DocumentRender, { type RenderData } from '../components/DocumentRender'
import { recomputeRow, sumColumn, formatSum } from '../lib/formula'
import { getFillableInputElements, getBlankFields } from '../lib/formFields'
import { textStyleToCss } from '../lib/textStyle'
import { Button, Field, inputCls, StatusPill } from '../components/ui'

/** Signature/database-field lookups use snake_case ids (e.g. "punong_barangay"),
 * but officialSnapshotFor() returns human-readable position names (e.g.
 * "Punong Barangay") to match how it's stored in Airtable. Normalize once
 * here rather than keeping a second, separately-computed snapshot. */
function toSnakeKeys(obj: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) out[k.toLowerCase().replace(/\s+/g, '_')] = v
  return out
}

export default function SubmissionEditor({ mode }: { mode: 'client' | 'admin' }) {
  const { formId, barangayId: routeBrgy, submissionId } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { forms, submissions, barangays, barangayName, officialSnapshotFor, createSubmission, updateSubmission } = useAirtableData()

  const existing = submissionId ? submissions.find(s => s.id === submissionId) : undefined
  const form = forms.find(f => f.id === (existing?.formId ?? formId)) ?? forms[0]
  const version = form.versions.find(v => v.version === (existing?.formVersion ?? form.currentVersion)) ?? form.versions[form.versions.length - 1]
  const barangayId = existing?.barangayId ?? routeBrgy ?? barangays[0]?.id ?? ''

  const [status, setStatus] = useState<Submission['status']>(existing?.status ?? 'draft')
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    if (existing) {
      for (const [k, v] of Object.entries(existing.data)) initial[k] = String(v)
    }
    return initial
  })
  const [tableRows, setTableRows] = useState<Record<string, Record<string, string>[]>>(existing?.tables ?? {})

  // Title-case snapshot (matches Airtable's stored convention) for new
  // submissions; existing ones just reuse whatever was frozen at fill time.
  const officialSnapshotTitleCase = existing?.officialSnapshot ?? officialSnapshotFor(barangayId)
  const officialSnapshotForRender = useMemo(() => toSnakeKeys(officialSnapshotTitleCase), [officialSnapshotTitleCase])

  const data: RenderData = useMemo(
    () => ({
      barangay_name: barangayName(barangayId),
      ...officialSnapshotForRender,
      ...values,
    }),
    [barangayId, officialSnapshotForRender, values, barangayName]
  )

  const inputElements = getFillableInputElements(version.elements)
  const blankFields = getBlankFields(version.elements)
  const tableElements = version.elements.filter(e => e.type === 'table')

  function setField(el: FormElement, v: string) {
    setValues(vals => ({ ...vals, [el.id]: v }))
  }

  function setBlankValue(blankId: string, v: string) {
    setValues(vals => ({ ...vals, [blankId]: v }))
  }

  function addRow(tableId: string, columns: TableColumn[]) {
    const blank = Object.fromEntries(columns.map(c => [c.id, '']))
    setTableRows(tr => ({
      ...tr,
      [tableId]: [...(tr[tableId] ?? []), recomputeRow(blank, columns)],
    }))
  }

  function updateRow(tableId: string, idx: number, colId: string, v: string, columns: TableColumn[]) {
    setTableRows(tr => {
      const rows = [...(tr[tableId] ?? [])]
      const edited = { ...rows[idx], [colId]: v }
      rows[idx] = recomputeRow(edited, columns)
      return { ...tr, [tableId]: rows }
    })
  }

  async function save(nextStatus: Submission['status']) {
    setSaving(true)
    setStatus(nextStatus)
    const now = new Date().toISOString()
    try {
      if (existing) {
        updateSubmission(existing.id, {
          status: nextStatus,
          data: values,
          tables: tableRows,
          updatedAt: now,
          submittedAt: nextStatus === 'submitted' ? (existing.submittedAt ?? now) : existing.submittedAt,
        })
      } else {
        await createSubmission({
          formId: form.id,
          formVersion: version.version,
          barangayId,
          clientId: session?.clientId ?? '',
          status: nextStatus,
          data: values,
          tables: tableRows,
          officialSnapshot: officialSnapshotTitleCase,
          createdAt: now,
          updatedAt: now,
          submittedAt: nextStatus === 'submitted' ? now : undefined,
        })
      }
      const backTo = mode === 'client' ? '/client/submissions' : '/admin/submissions'
      navigate(backTo)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="h-14 border-b border-line bg-white flex items-center px-6 gap-4 sticky top-0 z-10 print:hidden">
        <button
          onClick={() => navigate(mode === 'client' ? '/client' : '/admin/submissions')}
          className="focus-ring text-[13px] text-ink/50 hover:text-ink"
        >
          ← Back
        </button>
        <div>
          <div className="text-[13.5px] font-medium">{form.name}</div>
          <div className="text-[11.5px] text-ink/45">{barangayName(barangayId)} · v{version.version}</div>
        </div>
        <StatusPill status={status} />
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Download PDF
          </Button>
          {mode === 'client' && (
            <>
              <Button variant="secondary" disabled={saving} onClick={() => save('draft')}>
                Save draft
              </Button>
              <Button disabled={saving} onClick={() => save('submitted')}>
                Submit
              </Button>
            </>
          )}
          {mode === 'admin' && (
            <Button disabled={saving} onClick={() => save(status)}>
              Save changes
            </Button>
          )}
        </div>
      </div>

      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="w-96 shrink-0 border-r border-line bg-white overflow-y-auto p-6 print:hidden">
          <h2 className="text-[13px] font-medium mb-1">Form fields</h2>
          <p className="text-[12px] text-ink/45 mb-4">
            Barangay and official information is auto-filled from Airtable and cannot be edited here.
          </p>
          <div className="space-y-4">
            {inputElements.map(el => (
              <ElementInput key={el.id} el={el} value={values[el.id] ?? ''} onChange={v => setField(el, v)} />
            ))}

            {blankFields.map(b => (
              <Field key={b.id} label={b.label}>
                <input
                  className={inputCls}
                  value={values[b.id] ?? ''}
                  onChange={e => setBlankValue(b.id, e.target.value)}
                />
              </Field>
            ))}

            {tableElements.map(tel => {
              const summarizeCols = (tel.columns ?? []).filter(c => c.summarize)
              const rows = tableRows[tel.id] ?? []
              return (
                <div key={tel.id}>
                  <span className="block text-[12.5px] text-ink/60 mb-2">{tel.label}</span>
                  <div className="space-y-2">
                    {rows.map((row, i) => (
                      <div key={i} className="border border-line rounded-sm2 p-2.5 space-y-1.5">
                        {(tel.columns ?? []).map(c => (
                          <TableCellInput
                            key={c.id}
                            column={c}
                            value={row[c.id] ?? ''}
                            onChange={v => updateRow(tel.id, i, c.id, v, tel.columns ?? [])}
                          />
                        ))}
                      </div>
                    ))}
                    <Button variant="secondary" className="w-full justify-center" onClick={() => addRow(tel.id, tel.columns ?? [])}>
                      + Add row
                    </Button>
                    {summarizeCols.length > 0 && (
                      <div className="border border-line rounded-sm2 bg-paper px-3 py-2 space-y-1">
                        {summarizeCols.map(c => (
                          <div key={c.id} className="flex items-center justify-between text-[12.5px]">
                            <span className="text-ink/50">Total {c.label}</span>
                            <span className="font-semibold tabular-nums">{formatSum(sumColumn(rows, c.id))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto py-10 px-6" id="print-root">
          <DocumentRender pageLayout={version.page} elements={version.elements} data={data} tableRows={tableRows} />
        </div>
      </div>
    </div>
  )
}

function ElementInput({ el, value, onChange }: { el: FormElement; value: string; onChange: (v: string) => void }) {
  if (el.type === 'dropdown' || el.type === 'radio') {
    return (
      <Field label={el.label}>
        <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Select…</option>
          {el.options?.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </Field>
    )
  }
  if (el.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked ? 'true' : '')} className="accent-bottle-600" />
        {el.label}
      </label>
    )
  }
  if (el.type === 'long_text') {
    return (
      <Field label={el.label}>
        <textarea className={`${inputCls} h-20`} value={value} onChange={e => onChange(e.target.value)} />
      </Field>
    )
  }
  return (
    <Field label={el.label}>
      <input
        type={el.type === 'date' ? 'date' : el.type === 'number' || el.type === 'currency' ? 'number' : el.type === 'time' ? 'time' : 'text'}
        className={inputCls}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </Field>
  )
}

function TableCellInput({
  column,
  value,
  onChange,
}: {
  column: TableColumn
  value: string
  onChange: (v: string) => void
}) {
  const cls = `${inputCls} text-[12.5px] py-1.5`

  if (column.type === 'calculated') {
    return (
      <div
        className="flex items-center justify-between gap-2 border border-line rounded-sm2 px-3 py-1.5 bg-paper text-[12.5px]"
        style={{ textAlign: column.paragraphStyle?.align ?? 'left', ...textStyleToCss(column.textStyle) }}
      >
        <span className="text-ink/50">{column.label}</span>
        <span className="font-medium tabular-nums">{value || '0'}</span>
      </div>
    )
  }
  if (column.type === 'dropdown') {
    return (
      <select className={cls} style={textStyleToCss(column.textStyle)} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{column.label}…</option>
        {(column.options ?? []).map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }
  if (column.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-[12.5px]" style={textStyleToCss(column.textStyle)}>
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked ? 'true' : '')} className="accent-bottle-600" />
        {column.label}
      </label>
    )
  }
  return (
    <input
      type={column.type === 'date' ? 'date' : column.type === 'number' || column.type === 'currency' ? 'number' : 'text'}
      className={cls}
      style={{
        textAlign: column.paragraphStyle?.align === 'justify' ? 'left' : (column.paragraphStyle?.align ?? 'left'),
        ...textStyleToCss(column.textStyle),
      }}
      placeholder={column.label}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
