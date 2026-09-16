import { Link } from 'react-router-dom'
import { useAirtableData } from '../../lib/airtableStore'
import { useAuth } from '../../lib/auth'
import { StatusPill, Button } from '../../components/ui'

export default function Dashboard() {
  const { session } = useAuth()
  const { barangays, clients, submissions, formName, barangayName } = useAirtableData()
  const client = clients.find(c => c.id === session?.clientId)
  const assigned = barangays.filter(b => client?.barangayIds.includes(b.id))
  const mine = submissions.filter(s => s.clientId === client?.id)
  const drafts = mine.filter(s => s.status === 'draft')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[19px] font-semibold tracking-tight">Welcome, {client?.name}</h1>
          <p className="mt-1 text-[13.5px] text-ink/55">
            You have access to {assigned.length} barangay{assigned.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link to="/client/new">
          <Button>Start a new form</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-[14px] font-medium mb-3">Your assigned barangays</h2>
          <div className="border border-line rounded-sm2 bg-white divide-y divide-line2">
            {assigned.map(b => (
              <div key={b.id} className="px-5 py-3 text-[13.5px]">
                {b.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[14px] font-medium mb-3">Open drafts</h2>
          <div className="border border-line rounded-sm2 bg-white divide-y divide-line2">
            {drafts.length === 0 && <div className="px-5 py-6 text-[12.5px] text-ink/40">No open drafts.</div>}
            {drafts.map(s => (
              <Link
                key={s.id}
                to={`/client/fill/${s.formId}/${s.barangayId}/${s.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-paper transition-colors"
              >
                <div>
                  <div className="text-[13px] font-medium">{formName(s.formId)}</div>
                  <div className="text-[11.5px] text-ink/45">{barangayName(s.barangayId)}</div>
                </div>
                <StatusPill status={s.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
