import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAirtableData } from '../../lib/airtableStore'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui'

export default function NewForm() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { barangays, clients, forms } = useAirtableData()
  const client = clients.find(c => c.id === session?.clientId)
  const assigned = barangays.filter(b => client?.barangayIds.includes(b.id))

  const [barangayId, setBarangayId] = useState(assigned[0]?.id ?? '')
  const published = forms.filter(f => f.published)

  return (
    <div>
      <h1 className="text-[19px] font-semibold tracking-tight mb-1">New form</h1>
      <p className="text-[13.5px] text-ink/55 mb-8">Select the barangay, then choose which form to fill out.</p>

      <div className="mb-8">
        <h2 className="text-[13px] font-medium mb-3">1. Barangay</h2>
        <div className="flex flex-wrap gap-2">
          {assigned.map(b => (
            <button
              key={b.id}
              onClick={() => setBarangayId(b.id)}
              className={`px-3.5 py-1.5 rounded-sm2 text-[13px] border transition-colors ${
                barangayId === b.id ? 'bg-bottle-600 text-white border-bottle-600' : 'bg-white border-line hover:bg-paper'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-medium mb-3">2. Form</h2>
        <div className="grid grid-cols-2 gap-4 max-w-3xl">
          {published.map(f => (
            <div key={f.id} className="border border-line rounded-sm2 bg-white p-5 flex flex-col">
              <div className="text-[14px] font-medium">{f.name}</div>
              <p className="mt-1.5 text-[12.5px] text-ink/55 flex-1">{f.description}</p>
              <Button
                className="mt-4 justify-center"
                disabled={!barangayId}
                onClick={() => navigate(`/client/fill/${f.id}/${barangayId}`)}
              >
                Fill out
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
