import { useState } from 'react'
import { useAirtableData } from '../../lib/airtableStore'
import type { Client, Barangay } from '../../lib/types'
import { PageHeader, Button, StatusPill, LedgerTable, Row, Cell, Field, inputCls } from '../../components/ui'

export default function Clients() {
  const { clients, barangays, createClient, updateClientBarangays, updateClientPassword, toggleClientActive } = useAirtableData()
  const [editing, setEditing] = useState<Client | null>(null)
  const [settingPassword, setSettingPassword] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)

  function saveAssignments(id: string, barangayIds: string[]) {
    updateClientBarangays(id, barangayIds)
    setEditing(null)
  }

  function savePassword(id: string, password: string) {
    updateClientPassword(id, password)
    setSettingPassword(null)
  }

  function handleCreate(name: string, loginId: string, password: string, barangayIds: string[]) {
    createClient(name, loginId, password, barangayIds)
    setCreating(false)
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Barangay-facing accounts. Each client only sees barangays assigned below."
        actions={<Button onClick={() => setCreating(true)}>Create client</Button>}
      />
      <div className="p-8">
        <div className="border border-line rounded-sm2 bg-white px-5">
          <LedgerTable columns={['Name', 'Login ID', 'Assigned barangays', 'Status', '']}>
            {clients.map(c => (
              <Row key={c.id}>
                <Cell className="font-medium">{c.name}</Cell>
                <Cell className="font-mono text-[12.5px] text-ink/60">{c.loginId}</Cell>
                <Cell>
                  <span className="text-ink/70">{c.barangayIds.length} barangay{c.barangayIds.length !== 1 ? 's' : ''}</span>
                </Cell>
                <Cell>
                  <button onClick={() => toggleClientActive(c.id)}>
                    <StatusPill status={c.active ? 'active' : 'inactive'} />
                  </button>
                </Cell>
                <Cell className="text-right space-x-1">
                  <Button variant="ghost" onClick={() => setSettingPassword(c)}>
                    {c.password ? 'Reset password' : 'Set password'}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(c)}>
                    Manage
                  </Button>
                </Cell>
              </Row>
            ))}
          </LedgerTable>
        </div>
      </div>

      {editing && (
        <AssignDrawer
          client={editing}
          barangays={barangays}
          onClose={() => setEditing(null)}
          onSave={ids => saveAssignments(editing.id, ids)}
        />
      )}
      {settingPassword && (
        <PasswordDrawer
          client={settingPassword}
          onClose={() => setSettingPassword(null)}
          onSave={pw => savePassword(settingPassword.id, pw)}
        />
      )}
      {creating && <CreateDrawer barangays={barangays} onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  )
}

function AssignDrawer({
  client,
  barangays,
  onClose,
  onSave,
}: {
  client: Client
  barangays: Barangay[]
  onClose: () => void
  onSave: (ids: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(client.barangayIds))

  function toggle(id: string) {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <Drawer title={`Assign barangays — ${client.name}`} onClose={onClose}>
      <p className="text-[12.5px] text-ink/50 mb-4">
        The client's barangay picker and every backend request will be restricted to this list.
      </p>
      <div className="border border-line rounded-sm2 max-h-96 overflow-y-auto divide-y divide-line2">
        {barangays.map(b => (
          <label key={b.id} className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] hover:bg-paper cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(b.id)}
              onChange={() => toggle(b.id)}
              className="accent-bottle-600"
            />
            {b.name}
          </label>
        ))}
      </div>
      <div className="flex justify-between items-center mt-5">
        <span className="text-[12.5px] text-ink/50">{selected.size} selected</span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(Array.from(selected))}>Save assignments</Button>
        </div>
      </div>
    </Drawer>
  )
}

function PasswordDrawer({
  client,
  onClose,
  onSave,
}: {
  client: Client
  onClose: () => void
  onSave: (password: string) => void
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = password.length > 0 && confirm.length > 0 && password !== confirm

  return (
    <Drawer title={`${client.password ? 'Reset' : 'Set'} password — ${client.name}`} onClose={onClose}>
      <p className="text-[12.5px] text-ink/50 mb-4">
        {client.name} will use this password together with their Login ID (
        <span className="font-mono">{client.loginId}</span>) to sign in.
      </p>
      <div className="space-y-4">
        <Field label="New password">
          <input
            autoFocus
            type="text"
            className={`${inputCls} font-mono`}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="e.g. bulan2026"
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="text"
            className={`${inputCls} font-mono`}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </Field>
        {mismatch && <p className="text-[12.5px] text-clay">Passwords don't match.</p>}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!password || password !== confirm} onClick={() => onSave(password)}>
          Save password
        </Button>
      </div>
    </Drawer>
  )
}

function CreateDrawer({
  barangays,
  onClose,
  onCreate,
}: {
  barangays: Barangay[]
  onClose: () => void
  onCreate: (name: string, loginId: string, password: string, barangayIds: string[]) => void
}) {
  const [name, setName] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <Drawer title="Create client" onClose={onClose}>
      <div className="space-y-4 mb-5">
        <Field label="Full name">
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kenneth Golpo" />
        </Field>
        <Field label="Login ID" hint="Used together with the password to sign in.">
          <input className={inputCls} value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="e.g. kgolpo" />
        </Field>
        <Field label="Password">
          <input
            className={`${inputCls} font-mono`}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="e.g. bulan2026"
          />
        </Field>
      </div>
      <p className="text-[12.5px] text-ink/50 mb-2">Assign barangays</p>
      <div className="border border-line rounded-sm2 max-h-72 overflow-y-auto divide-y divide-line2">
        {barangays.map(b => (
          <label key={b.id} className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] hover:bg-paper cursor-pointer">
            <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)} className="accent-bottle-600" />
            {b.name}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!name.trim() || !loginId.trim() || !password}
          onClick={() => onCreate(name.trim(), loginId.trim(), password, Array.from(selected))}
        >
          Create client
        </Button>
      </div>
    </Drawer>
  )
}

function Drawer({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-doc p-7 overflow-y-auto">
        <h2 className="text-[15px] font-semibold mb-5">{title}</h2>
        {children}
      </div>
    </div>
  )
}
