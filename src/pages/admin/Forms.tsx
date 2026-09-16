import { useNavigate } from 'react-router-dom'
import { useAirtableData } from '../../lib/airtableStore'
import { PageHeader, Button, StatusPill, LedgerTable, Row, Cell } from '../../components/ui'

export default function Forms() {
  const navigate = useNavigate()
  const { forms } = useAirtableData()

  return (
    <div>
      <PageHeader
        title="Forms"
        subtitle="Document-oriented procurement form templates."
        actions={<Button onClick={() => navigate('/admin/forms/new')}>Create form</Button>}
      />
      <div className="p-8">
        <div className="border border-line rounded-sm2 bg-white px-5">
          <LedgerTable columns={['Form', 'Category', 'Version', 'Updated', 'Status', '']}>
            {forms.map(f => (
              <Row key={f.id} onClick={() => navigate(`/admin/forms/${f.id}`)}>
                <Cell className="font-medium">
                  {f.name}
                  <div className="text-[12px] text-ink/45 font-normal mt-0.5 max-w-md">{f.description}</div>
                </Cell>
                <Cell className="text-ink/60">{f.category}</Cell>
                <Cell className="text-ink/60">v{f.currentVersion}</Cell>
                <Cell className="text-ink/60">{f.updatedAt}</Cell>
                <Cell>
                  <StatusPill status={f.published ? 'published' : 'unpublished'} />
                </Cell>
                <Cell className="text-right text-bottle-600">Open →</Cell>
              </Row>
            ))}
          </LedgerTable>
        </div>
      </div>
    </div>
  )
}
