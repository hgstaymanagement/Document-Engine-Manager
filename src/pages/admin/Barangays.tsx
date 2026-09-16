import { useState } from 'react'
import { useAirtableData } from '../../lib/airtableStore'
import type { Official } from '../../lib/types'
import { PageHeader, LedgerTable, Row, Cell, Button, inputCls } from '../../components/ui'

const POSITIONS = ['Punong Barangay', 'Treasurer', 'Secretary', 'Kagawad']

export default function Barangays() {
  const {
    barangays,
    officials,
    createBarangay,
    updateBarangayName,
    deleteBarangay,
    createOfficial,
    updateOfficial,
    deleteOfficial,
  } = useAirtableData()
  const [active, setActive] = useState(barangays[0]?.id ?? '')
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null)
  const [editingBarangayName, setEditingBarangayName] = useState(false)
  const [addingBarangay, setAddingBarangay] = useState(false)
  const [addingOfficial, setAddingOfficial] = useState(false)

  const activeBarangay = barangays.find(b => b.id === active)
  const list = officials.filter(o => o.barangayId === active)

  async function handleAddBarangay(name: string) {
    const id = await createBarangay(name)
    setActive(id)
    setAddingBarangay(false)
  }

  function handleDeleteBarangay(id: string) {
    const b = barangays.find(x => x.id === id)
    const officialCount = officials.filter(o => o.barangayId === id).length
    const warning =
      officialCount > 0
        ? `Delete ${b?.name}? This also deletes its ${officialCount} official record${officialCount === 1 ? '' : 's'}. This cannot be undone.`
        : `Delete ${b?.name}? This cannot be undone.`
    if (!confirm(warning)) return
    deleteBarangay(id)
    if (active === id) setActive(barangays.find(x => x.id !== id)?.id ?? '')
  }

  function handleAddOfficial(name: string, position: string) {
    createOfficial(active, name, position)
    setAddingOfficial(false)
  }

  function handleDeleteOfficial(o: Official) {
    if (!confirm(`Remove ${o.name} (${o.position})?`)) return
    deleteOfficial(o.id)
  }

  return (
    <div>
      <PageHeader
        title="Barangays"
        subtitle="Barangay and official master data, synced live with Airtable."
        actions={<Button onClick={() => setAddingBarangay(true)}>Add barangay</Button>}
      />
      <div className="flex" style={{ height: 'calc(100vh - 105px)' }}>
        <div className="w-72 shrink-0 border-r border-line bg-white overflow-y-auto">
          {barangays.map(b => (
            <button
              key={b.id}
              onClick={() => setActive(b.id)}
              className={`w-full text-left px-5 py-2.5 text-[13.5px] border-l-2 transition-colors ${
                active === b.id
                  ? 'border-bottle-600 bg-bottle-50 text-bottle-700 font-medium'
                  : 'border-transparent hover:bg-paper text-ink/75'
              }`}
            >
              {b.name}
            </button>
          ))}
          {barangays.length === 0 && (
            <p className="px-5 py-6 text-[12.5px] text-ink/40">No barangays yet — add one above.</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {activeBarangay ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                {editingBarangayName ? (
                  <input
                    autoFocus
                    defaultValue={activeBarangay.name}
                    className={`${inputCls} max-w-xs text-[15px] font-semibold py-1`}
                    onBlur={e => {
                      const v = e.target.value.trim()
                      if (v) updateBarangayName(activeBarangay.id, v)
                      setEditingBarangayName(false)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setEditingBarangayName(false)
                    }}
                  />
                ) : (
                  <h2 className="text-[15px] font-semibold">{activeBarangay.name}</h2>
                )}
                <button
                  onClick={() => setEditingBarangayName(true)}
                  className="focus-ring text-[12px] text-bottle-600 hover:underline"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDeleteBarangay(activeBarangay.id)}
                  className="focus-ring text-[12px] text-clay hover:underline"
                >
                  Delete barangay
                </button>
              </div>
              <p className="text-[12.5px] text-ink/50 mb-6">Barangay officials</p>

              <div className="border border-line rounded-sm2 bg-white px-5 max-w-2xl">
                <LedgerTable columns={['Position', 'Name', '']}>
                  {list.map(o => (
                    <Row key={o.id}>
                      <Cell className="text-ink/60">
                        <select
                          value={o.position}
                          onChange={e => updateOfficial(o.id, { position: e.target.value })}
                          className="focus-ring border border-transparent hover:border-line rounded-sm2 -ml-1.5 px-1.5 py-1 bg-transparent"
                        >
                          {POSITIONS.map(p => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </Cell>
                      <Cell>
                        {editingOfficialId === o.id ? (
                          <input
                            autoFocus
                            defaultValue={o.name}
                            className={inputCls}
                            onBlur={e => {
                              updateOfficial(o.id, { name: e.target.value })
                              setEditingOfficialId(null)
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            }}
                          />
                        ) : (
                          <span className="font-medium">{o.name}</span>
                        )}
                      </Cell>
                      <Cell className="text-right space-x-1">
                        <Button variant="ghost" onClick={() => setEditingOfficialId(o.id)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => handleDeleteOfficial(o)}>
                          Remove
                        </Button>
                      </Cell>
                    </Row>
                  ))}
                </LedgerTable>
                {list.length === 0 && (
                  <p className="py-6 text-[12.5px] text-ink/40">No officials on file for this barangay yet.</p>
                )}
              </div>

              <div className="max-w-2xl mt-3">
                {addingOfficial ? (
                  <AddOfficialForm onAdd={handleAddOfficial} onCancel={() => setAddingOfficial(false)} />
                ) : (
                  <Button variant="secondary" onClick={() => setAddingOfficial(true)}>
                    + Add official
                  </Button>
                )}
              </div>

              <p className="mt-4 text-[12px] text-ink/40 max-w-2xl">
                Changing an official's name here does not alter any historical submission — submitted
                forms freeze a snapshot of official data at the time they were filled out.
              </p>
            </>
          ) : (
            <p className="text-[13px] text-ink/45">Select a barangay, or add one to get started.</p>
          )}
        </div>
      </div>

      {addingBarangay && <AddBarangayDrawer onAdd={handleAddBarangay} onCancel={() => setAddingBarangay(false)} />}
    </div>
  )
}

function AddOfficialForm({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, position: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState(POSITIONS[0])

  return (
    <div className="border border-line rounded-sm2 bg-white p-4 flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-[11.5px] text-ink/50 mb-1">Name</label>
        <input
          autoFocus
          className={inputCls}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name"
        />
      </div>
      <div>
        <label className="block text-[11.5px] text-ink/50 mb-1">Position</label>
        <select value={position} onChange={e => setPosition(e.target.value)} className={inputCls}>
          {POSITIONS.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        disabled={!name.trim()}
        onClick={() => {
          onAdd(name.trim(), position)
          setName('')
        }}
      >
        Add
      </Button>
    </div>
  )
}

function AddBarangayDrawer({ onAdd, onCancel }: { onAdd: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('')

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/30" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-doc p-7">
        <h2 className="text-[15px] font-semibold mb-5">Add barangay</h2>
        <label className="block text-[12.5px] text-ink/60 mb-1.5">Barangay name</label>
        <input
          autoFocus
          className={inputCls}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. New Barangay"
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim()) onAdd(name.trim())
          }}
        />
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={() => onAdd(name.trim())}>
            Add barangay
          </Button>
        </div>
      </div>
    </div>
  )
}
