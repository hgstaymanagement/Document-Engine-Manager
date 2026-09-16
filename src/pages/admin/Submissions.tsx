import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAirtableData } from '../../lib/airtableStore'
import { PageHeader, StatusPill, LedgerTable, Row, Cell, Button, inputCls } from '../../components/ui'

export default function Submissions() {
  const { submissions: list, forms, barangays, clients, barangayName, formName, clientName, deleteSubmission } = useAirtableData()
  const [formFilter, setFormFilter] = useState('')
  const [brgyFilter, setBrgyFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(
    () =>
      list.filter(
        s =>
          (!formFilter || s.formId === formFilter) &&
          (!brgyFilter || s.barangayId === brgyFilter) &&
          (!clientFilter || s.clientId === clientFilter)
      ),
    [list, formFilter, brgyFilter, clientFilter]
  )

  function remove(id: string) {
    if (!confirm('Delete this submission? This cannot be undone.')) return
    deleteSubmission(id)
  }

  return (
    <div>
      <PageHeader title="Submissions" subtitle="All submissions across every barangay and client." />
      <div className="p-8">
        <div className="flex gap-3 mb-5">
          <select className={`${inputCls} w-48`} value={formFilter} onChange={e => setFormFilter(e.target.value)}>
            <option value="">All forms</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select className={`${inputCls} w-48`} value={brgyFilter} onChange={e => setBrgyFilter(e.target.value)}>
            <option value="">All barangays</option>
            {barangays.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select className={`${inputCls} w-48`} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border border-line rounded-sm2 bg-white px-5">
          <LedgerTable columns={['Form', 'Barangay', 'Client', 'Updated', 'Status', '']}>
            {filtered.map(s => (
              <Row key={s.id}>
                <Cell className="font-medium">
                  {formName(s.formId)}
                  <div className="text-[11.5px] text-ink/40 font-normal font-mono mt-0.5">{s.id} · v{s.formVersion}</div>
                </Cell>
                <Cell>{barangayName(s.barangayId)}</Cell>
                <Cell>{clientName(s.clientId)}</Cell>
                <Cell className="text-ink/55">{new Date(s.updatedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</Cell>
                <Cell>
                  <StatusPill status={s.status} />
                </Cell>
                <Cell className="text-right space-x-1">
                  <Button variant="ghost" onClick={() => navigate(`/admin/submissions/${s.id}`)}>
                    Open
                  </Button>
                  <Button variant="danger" onClick={() => remove(s.id)}>
                    Delete
                  </Button>
                </Cell>
              </Row>
            ))}
          </LedgerTable>
          {filtered.length === 0 && <div className="py-14 text-center text-[13px] text-ink/45">No submissions match these filters.</div>}
        </div>
      </div>
    </div>
  )
}
