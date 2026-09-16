import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { TABLES, FIELDS } from './airtableConfig'
import { listAll, createRecords, updateRecords, deleteRecords, isAirtableConfigured } from './airtableClient'
import {
  mapBarangay,
  mapOfficial,
  mapClient,
  mapFormVersion,
  assembleForms,
  versionNumberByRecordId,
  mapSubmission,
  type RawFormVersion,
} from './airtableMappers'
import { createDebouncer } from './debounce'
import type { Barangay, Official, Client, ProcurementForm, FormVersion, Submission } from './types'

const debouncer = createDebouncer(800)
const F = FIELDS

interface Ctx {
  loading: boolean
  error: string | null
  barangays: Barangay[]
  officials: Official[]
  clients: Client[]
  forms: ProcurementForm[]
  submissions: Submission[]

  barangayName: (id: string) => string
  clientName: (id: string) => string
  formName: (id: string) => string
  officialSnapshotFor: (barangayId: string) => Record<string, string>

  getForm: (id: string) => ProcurementForm | undefined
  updateForm: (id: string, updater: (f: ProcurementForm) => ProcurementForm) => void
  createForm: () => Promise<string>
  createNewVersion: (formId: string) => Promise<void>

  createClient: (name: string, loginId: string, password: string, barangayIds: string[]) => Promise<void>
  updateClientBarangays: (id: string, barangayIds: string[]) => void
  updateClientPassword: (id: string, password: string) => void
  toggleClientActive: (id: string) => void

  createBarangay: (name: string) => Promise<string>
  updateBarangayName: (id: string, name: string) => void
  deleteBarangay: (id: string) => void

  createOfficial: (barangayId: string, name: string, position: string) => Promise<void>
  updateOfficial: (id: string, patch: { name?: string; position?: string }) => void
  deleteOfficial: (id: string) => void

  createSubmission: (input: Omit<Submission, 'id'>) => Promise<string>
  updateSubmission: (id: string, patch: Partial<Submission>) => void
  deleteSubmission: (id: string) => void

  refresh: () => void
}

const AirtableCtx = createContext<Ctx | null>(null)

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function defaultPage(): FormVersion['page'] {
  return { size: 'Letter', orientation: 'portrait', margins: { top: 20, right: 18, bottom: 20, left: 18 } }
}

function versionFields(form: ProcurementForm, v: FormVersion) {
  return {
    [F.formVersions.name]: `${form.name} v${v.version}`,
    [F.formVersions.form]: [form.id],
    [F.formVersions.version]: v.version,
    [F.formVersions.createdAt]: v.createdAt,
    ...(v.changeNote ? { [F.formVersions.changeNote]: v.changeNote } : {}),
    [F.formVersions.pageSize]: v.page.size,
    [F.formVersions.orientation]: v.page.orientation,
    [F.formVersions.marginsJson]: JSON.stringify(v.page.margins),
    [F.formVersions.elementsJson]: JSON.stringify(v.elements),
  }
}

function formFields(form: ProcurementForm) {
  return {
    [F.forms.name]: form.name,
    [F.forms.description]: form.description,
    [F.forms.category]: form.category,
    [F.forms.published]: form.published,
    [F.forms.currentVersion]: form.currentVersion,
    [F.forms.updatedAt]: form.updatedAt,
  }
}

function submissionFields(s: Submission, formVersionRecordId: string | undefined) {
  return {
    [F.submissions.name]: (s.data.pr_no as string) || (s.data.supplier as string) || s.id,
    [F.submissions.form]: [s.formId],
    ...(formVersionRecordId ? { [F.submissions.formVersion]: [formVersionRecordId] } : {}),
    [F.submissions.barangay]: [s.barangayId],
    [F.submissions.client]: [s.clientId],
    [F.submissions.status]: s.status === 'submitted' ? 'Submitted' : 'Draft',
    [F.submissions.dataJson]: JSON.stringify({ values: s.data, tables: s.tables ?? {} }),
    [F.submissions.officialSnapshotJson]: JSON.stringify(s.officialSnapshot),
    [F.submissions.createdAt]: s.createdAt,
    [F.submissions.updatedAt]: s.updatedAt,
    ...(s.submittedAt ? { [F.submissions.submittedAt]: s.submittedAt } : {}),
  }
}

export function AirtableProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [officials, setOfficials] = useState<Official[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [forms, setForms] = useState<ProcurementForm[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  // Record-id lookups needed only for writes, not for rendering — kept in
  // a ref since updating it should never trigger a re-render.
  const formVersionRecordId = useRef<Map<string, string>>(new Map()) // `${formId}:${version}` -> recordId

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [brgyRecs, offRecs, cliRecs, formRecs, verRecs, subRecs] = await Promise.all([
        listAll(TABLES.barangays),
        listAll(TABLES.officials),
        listAll(TABLES.clients),
        listAll(TABLES.forms),
        listAll(TABLES.formVersions),
        listAll(TABLES.submissions),
      ])

      const rawVersions: RawFormVersion[] = verRecs.map(mapFormVersion)
      formVersionRecordId.current = new Map(rawVersions.map(v => [`${v.formRecordId}:${v.version.version}`, v.recordId]))

      const assembledForms = assembleForms(formRecs, rawVersions)
      const versionNums = versionNumberByRecordId(rawVersions)

      setBarangays(brgyRecs.map(mapBarangay))
      setOfficials(offRecs.map(mapOfficial))
      setClients(cliRecs.map(mapClient))
      setForms(assembledForms)
      setSubmissions(subRecs.map(r => mapSubmission(r, versionNums)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAirtableConfigured()) {
      setLoading(false)
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function barangayName(id: string) {
    return barangays.find(b => b.id === id)?.name ?? id
  }
  function clientName(id: string) {
    return clients.find(c => c.id === id)?.name ?? id
  }
  function formName(id: string) {
    return forms.find(f => f.id === id)?.name ?? id
  }
  function officialSnapshotFor(barangayId: string) {
    const list = officials.filter(o => o.barangayId === barangayId)
    const snap: Record<string, string> = {}
    for (const o of list) if (!snap[o.position]) snap[o.position] = o.name
    return snap
  }

  function getForm(id: string) {
    return forms.find(f => f.id === id)
  }

  function persistForm(form: ProcurementForm) {
    updateRecords(TABLES.forms, [{ id: form.id, fields: formFields(form) }]).catch(e => setError(String(e)))
    const versionPatches: { id: string; fields: Record<string, unknown> }[] = []
    for (const v of form.versions) {
      const recId = formVersionRecordId.current.get(`${form.id}:${v.version}`)
      if (recId) versionPatches.push({ id: recId, fields: versionFields(form, v) })
    }
    if (versionPatches.length) {
      updateRecords(TABLES.formVersions, versionPatches).catch(e => setError(String(e)))
    }
  }

  function updateForm(id: string, updater: (f: ProcurementForm) => ProcurementForm) {
    // The merge happens INSIDE the functional setState updater, using the
    // `f` React hands us here — which is always the true latest queued
    // state, never a stale snapshot — rather than reading a separately
    // synced ref beforehand. Reading from a ref that's synced via a
    // useEffect (which only runs after each commit) meant fast, repeated
    // calls to updateForm — exactly what happens on every keystroke in the
    // form builder — could compute the "next" value from a form state that
    // hadn't caught up yet, silently discarding whatever character(s) were
    // typed in between. That's what caused the garbled/dropped-character
    // bug when typing in the form name or any element label.
    let next: ProcurementForm | null = null
    setForms(fs =>
      fs.map(f => {
        if (f.id !== id) return f
        next = { ...updater(f), updatedAt: todayIso() }
        return next
      })
    )
    if (next) debouncer.schedule(`form:${id}`, () => persistForm(next!))
  }

  async function createForm(): Promise<string> {
    const [formRec] = await createRecords(TABLES.forms, [
      {
        fields: {
          [F.forms.name]: 'Untitled Form',
          [F.forms.description]: '',
          [F.forms.category]: 'Procurement',
          [F.forms.published]: false,
          [F.forms.currentVersion]: 1,
          [F.forms.updatedAt]: todayIso(),
        },
      },
    ])
    const version: FormVersion = { version: 1, createdAt: todayIso(), page: defaultPage(), elements: [] }
    const newForm: ProcurementForm = {
      id: formRec.id,
      name: 'Untitled Form',
      description: '',
      category: 'Procurement',
      currentVersion: 1,
      published: false,
      updatedAt: todayIso(),
      versions: [version],
    }
    const [verRec] = await createRecords(TABLES.formVersions, [{ fields: versionFields(newForm, version) }])
    formVersionRecordId.current.set(`${formRec.id}:1`, verRec.id)
    setForms(fs => [newForm, ...fs])
    return formRec.id
  }

  async function createNewVersion(formId: string) {
    const form = forms.find(f => f.id === formId)
    if (!form) return
    const last = form.versions[form.versions.length - 1]
    const nextVersion: FormVersion = {
      ...structuredClone(last),
      version: form.versions.length + 1,
      createdAt: todayIso(),
      changeNote: 'New version created from builder',
    }
    const updatedForm: ProcurementForm = { ...form, versions: [...form.versions, nextVersion], currentVersion: nextVersion.version, updatedAt: todayIso() }
    const [verRec] = await createRecords(TABLES.formVersions, [{ fields: versionFields(updatedForm, nextVersion) }])
    formVersionRecordId.current.set(`${formId}:${nextVersion.version}`, verRec.id)
    setForms(fs => fs.map(f => (f.id === formId ? updatedForm : f)))
    updateRecords(TABLES.forms, [{ id: formId, fields: formFields(updatedForm) }]).catch(e => setError(String(e)))
  }

  async function createClient(name: string, loginId: string, password: string, barangayIds: string[]) {
    const [rec] = await createRecords(TABLES.clients, [
      {
        fields: {
          [F.clients.name]: name,
          [F.clients.loginId]: loginId,
          [F.clients.password]: password,
          [F.clients.active]: true,
          [F.clients.assignedBarangays]: barangayIds,
        },
      },
    ])
    setClients(cs => [{ id: rec.id, name, loginId, password, active: true, barangayIds }, ...cs])
  }

  function updateClientBarangays(id: string, barangayIds: string[]) {
    setClients(cs => cs.map(c => (c.id === id ? { ...c, barangayIds } : c)))
    updateRecords(TABLES.clients, [{ id, fields: { [F.clients.assignedBarangays]: barangayIds } }]).catch(e => setError(String(e)))
  }

  function updateClientPassword(id: string, password: string) {
    setClients(cs => cs.map(c => (c.id === id ? { ...c, password } : c)))
    updateRecords(TABLES.clients, [{ id, fields: { [F.clients.password]: password } }]).catch(e => setError(String(e)))
  }

  function toggleClientActive(id: string) {
    const current = clients.find(c => c.id === id)
    if (!current) return
    const active = !current.active
    setClients(cs => cs.map(c => (c.id === id ? { ...c, active } : c)))
    updateRecords(TABLES.clients, [{ id, fields: { [F.clients.active]: active } }]).catch(e => setError(String(e)))
  }

  async function createBarangay(name: string): Promise<string> {
    const [rec] = await createRecords(TABLES.barangays, [{ fields: { [F.barangays.name]: name } }])
    setBarangays(bs => [...bs, { id: rec.id, name }].sort((a, b) => a.name.localeCompare(b.name)))
    return rec.id
  }

  function updateBarangayName(id: string, name: string) {
    setBarangays(bs => bs.map(b => (b.id === id ? { ...b, name } : b)))
    updateRecords(TABLES.barangays, [{ id, fields: { [F.barangays.name]: name } }]).catch(e => setError(String(e)))
  }

  function deleteBarangay(id: string) {
    // Cascade: officials belong to exactly one barangay and are meaningless
    // without it, so they're deleted along with it. Clients' assigned
    // barangays and past submissions are left as-is — those are historical
    // facts (who filed what) and shouldn't quietly disappear.
    const officialIds = officials.filter(o => o.barangayId === id).map(o => o.id)
    setBarangays(bs => bs.filter(b => b.id !== id))
    setOfficials(os => os.filter(o => o.barangayId !== id))
    deleteRecords(TABLES.barangays, [id]).catch(e => setError(String(e)))
    if (officialIds.length) deleteRecords(TABLES.officials, officialIds).catch(e => setError(String(e)))
  }

  async function createOfficial(barangayId: string, name: string, position: string) {
    const [rec] = await createRecords(TABLES.officials, [
      { fields: { [F.officials.name]: name, [F.officials.position]: position, [F.officials.barangay]: [barangayId] } },
    ])
    setOfficials(os => [...os, { id: rec.id, barangayId, name, position: position as Official['position'] }])
  }

  function updateOfficial(id: string, patch: { name?: string; position?: string }) {
    setOfficials(os => os.map(o => (o.id === id ? { ...o, ...patch } as Official : o)))
    const fields: Record<string, unknown> = {}
    if (patch.name !== undefined) fields[F.officials.name] = patch.name
    if (patch.position !== undefined) fields[F.officials.position] = patch.position
    updateRecords(TABLES.officials, [{ id, fields }]).catch(e => setError(String(e)))
  }

  function deleteOfficial(id: string) {
    setOfficials(os => os.filter(o => o.id !== id))
    deleteRecords(TABLES.officials, [id]).catch(e => setError(String(e)))
  }

  async function createSubmission(input: Omit<Submission, 'id'>): Promise<string> {
    const formVerRecId = formVersionRecordId.current.get(`${input.formId}:${input.formVersion}`)
    const [rec] = await createRecords(TABLES.submissions, [{ fields: submissionFields({ ...input, id: '' }, formVerRecId) }])
    setSubmissions(ss => [{ ...input, id: rec.id }, ...ss])
    return rec.id
  }

  function updateSubmission(id: string, patch: Partial<Submission>) {
    let next: Submission | null = null
    setSubmissions(ss =>
      ss.map(s => {
        if (s.id !== id) return s
        next = { ...s, ...patch }
        return next
      })
    )
    if (!next) return
    debouncer.schedule(`submission:${id}`, () => {
      const formVerRecId = formVersionRecordId.current.get(`${next!.formId}:${next!.formVersion}`)
      updateRecords(TABLES.submissions, [{ id, fields: submissionFields(next!, formVerRecId) }]).catch(e => setError(String(e)))
    })
  }

  function deleteSubmission(id: string) {
    setSubmissions(ss => ss.filter(s => s.id !== id))
    deleteRecords(TABLES.submissions, [id]).catch(e => setError(String(e)))
  }

  const value: Ctx = {
    loading,
    error,
    barangays,
    officials,
    clients,
    forms,
    submissions,
    barangayName,
    clientName,
    formName,
    officialSnapshotFor,
    getForm,
    updateForm,
    createForm,
    createNewVersion,
    createClient,
    updateClientBarangays,
    updateClientPassword,
    toggleClientActive,
    createBarangay,
    updateBarangayName,
    deleteBarangay,
    createOfficial,
    updateOfficial,
    deleteOfficial,
    createSubmission,
    updateSubmission,
    deleteSubmission,
    refresh: load,
  }

  if (!isAirtableConfigured()) {
    return <ConfigMissingScreen />
  }

  return <AirtableCtx.Provider value={value}>{children}</AirtableCtx.Provider>
}

function ConfigMissingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
      <div className="max-w-md text-center">
        <h1 className="text-[16px] font-semibold mb-2">Airtable not configured</h1>
        <p className="text-[13.5px] text-ink/60 leading-relaxed">
          Copy <code className="font-mono bg-paper px-1 rounded-sm2">.env.example</code> to{' '}
          <code className="font-mono bg-paper px-1 rounded-sm2">.env</code> and add a Personal Access Token from{' '}
          <code className="font-mono bg-paper px-1 rounded-sm2">airtable.com/create/tokens</code> with read/write
          access to the <code className="font-mono bg-paper px-1 rounded-sm2">claude.form-builder.database</code>{' '}
          base, then restart the dev server.
        </p>
      </div>
    </div>
  )
}

export function useAirtableData() {
  const ctx = useContext(AirtableCtx)
  if (!ctx) throw new Error('useAirtableData must be used within AirtableProvider')
  return ctx
}
