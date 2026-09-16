import { useNavigate } from 'react-router-dom'
import { useAirtableData } from '../../lib/airtableStore'
import { useAuth } from '../../lib/auth'
import { LedgerTable, Row, Cell, StatusPill, Button, EmptyState } from '../../components/ui'

export default function MySubmissions() {
  const { session } = useAuth()
  const { submissions, clients, formName, barangayName } = useAirtableData()
  const client = clients.find(c => c.id === session?.clientId)
  const mine = submissions.filter(s => s.clientId === client?.id)
  const navigate = useNavigate()

  return (
    <div>
      <h1 className="text-[19px] font-semibold tracking-tight mb-1">My submissions</h1>
      <p className="text-[13.5px] text-ink/55 mb-8">Everything you've drafted or submitted across your assigned barangays.</p>

      <div className="border border-line rounded-sm2 bg-white px-5">
        <LedgerTable columns={['Form', 'Barangay', 'Updated', 'Status', '']}>
          {mine.map(s => (
            <Row key={s.id}>
              <Cell className="font-medium">{formName(s.formId)}</Cell>
              <Cell>{barangayName(s.barangayId)}</Cell>
              <Cell className="text-ink/55">{new Date(s.updatedAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}</Cell>
              <Cell>
                <StatusPill status={s.status} />
              </Cell>
              <Cell className="text-right">
                <Button variant="ghost" onClick={() => navigate(`/client/fill/${s.formId}/${s.barangayId}/${s.id}`)}>
                  {s.status === 'draft' ? 'Continue' : 'Open'}
                </Button>
              </Cell>
            </Row>
          ))}
        </LedgerTable>
        {mine.length === 0 && <EmptyState title="No submissions yet" hint="Start a new form from the New Form tab." />}
      </div>
    </div>
  )
}
