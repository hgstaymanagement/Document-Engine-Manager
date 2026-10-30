import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { useAuth } from './auth'
import { createDebouncer } from './debounce'
import {
  mapBarangay,
  mapOfficial,
  mapClients,
  mapFormVersion,
  assembleForms,
  versionNumberByRecordId,
  mapSubmission,
  type RawFormVersion,
  type DbBarangay,
  type DbOfficial,
  type DbProfile,
  type DbClientBarangay,
  type DbForm,
  type DbFormVersion,
  type DbSubmission,
} from './supabaseMappers'
import type { Barangay, Official, Client, ProcurementForm, FormVersion, Submission } from './types'

const debouncer = createDebouncer(800)

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

const DataCtx = createContext<Ctx | null>(null)

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function defaultPage(): FormVersion['page'] {
  return { size: 'Letter', orientation: 'portrait', margins: { top: 20, right: 18, bottom: 20, left: 18 } }
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function formRow(form: ProcurementForm) {
  return {
    name: form.name,
    description: form.description,
    category: form.category,
    published: form.published,
    current_version: form.currentVersion,
    updated_at: form.updatedAt,
  }
}

function versionRow(formId: string, v: FormVersion) {
  return {
    form_id: formId,
    version: v.version,
    created_at: v.createdAt,
    change_note: v.changeNote ?? null,
    page_size: v.page.size,
    orientation: v.page.orientation,
    margins: v.page.margins,
    elements: v.elements,
  }
}

function submissionRow(s: Submission, formVersionId: string) {
  return {
    form_id: s.formId,
    form_version_id: formVersionId,
    barangay_id: s.barangayId,
    client_id: s.clientId,
    status: s.status,
    data: s.data,
    tables: s.tables ?? {},
    official_snapshot: s.officialSnapshot,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    submitted_at: s.submittedAt ?? null,
  }
}

async function invokeAdminClients(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-clients', { body })
  if (error) throw new Error(error.message)
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error))
  }
  return data as Record<string, unknown>
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session, authReady } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [officials, setOfficials] = useState<Official[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [forms, setForms] = useState<ProcurementForm[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])

  const formVersionRecordId = useRef<Map<string, string>>(new Map())

  async function load() {
    if (!session) {
      setBarangays([])
      setOfficials([])
      setClients([])
      setForms([])
      setSubmissions([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [brgyRes, offRes, profRes, assignRes, formRes, verRes, subRes] = await Promise.all([
        supabase.from('barangays').select('*').order('name'),
        supabase.from('officials').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('client_barangays').select('*'),
        supabase.from('forms').select('*').order('updated_at', { ascending: false }),
        supabase.from('form_versions').select('*'),
        supabase.from('submissions').select('*').order('updated_at', { ascending: false }),
      ])

      throwIfError(brgyRes.error)
      throwIfError(offRes.error)
      throwIfError(profRes.error)
      throwIfError(assignRes.error)
      throwIfError(formRes.error)
      throwIfError(verRes.error)
      throwIfError(subRes.error)

      const rawVersions: RawFormVersion[] = ((verRes.data ?? []) as DbFormVersion[]).map(mapFormVersion)
      formVersionRecordId.current = new Map(rawVersions.map(v => [`${v.formId}:${v.version.version}`, v.recordId]))
      const versionNums = versionNumberByRecordId(rawVersions)

      setBarangays(((brgyRes.data ?? []) as DbBarangay[]).map(mapBarangay))
      setOfficials(((offRes.data ?? []) as DbOfficial[]).map(mapOfficial))
      setClients(mapClients((profRes.data ?? []) as DbProfile[], (assignRes.data ?? []) as DbClientBarangay[]))
      setForms(assembleForms((formRes.data ?? []) as DbForm[], rawVersions))
      setSubmissions(((subRes.data ?? []) as DbSubmission[]).map(r => mapSubmission(r, versionNums)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured() || !authReady) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, session?.clientId, session?.role])

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
    supabase
      .from('forms')
      .update(formRow(form))
      .eq('id', form.id)
      .then(({ error: e }) => {
        if (e) setError(e.message)
      })
    for (const v of form.versions) {
      const recId = formVersionRecordId.current.get(`${form.id}:${v.version}`)
      if (!recId) continue
      supabase
        .from('form_versions')
        .update(versionRow(form.id, v))
        .eq('id', recId)
        .then(({ error: e }) => {
          if (e) setError(e.message)
        })
    }
  }

  function updateForm(id: string, updater: (f: ProcurementForm) => ProcurementForm) {
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
    const { data: form, error: formErr } = await supabase
      .from('forms')
      .insert({
        name: 'Untitled Form',
        description: '',
        category: 'Procurement',
        published: false,
        current_version: 1,
        updated_at: todayIso(),
      })
      .select()
      .single()
    throwIfError(formErr)
    const version: FormVersion = { version: 1, createdAt: todayIso(), page: defaultPage(), elements: [] }
    const { data: ver, error: verErr } = await supabase
      .from('form_versions')
      .insert(versionRow(form.id, version))
      .select()
      .single()
    throwIfError(verErr)
    formVersionRecordId.current.set(`${form.id}:1`, ver.id)
    const newForm: ProcurementForm = {
      id: form.id,
      name: 'Untitled Form',
      description: '',
      category: 'Procurement',
      currentVersion: 1,
      published: false,
      updatedAt: todayIso(),
      versions: [version],
    }
    setForms(fs => [newForm, ...fs])
    return form.id
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
    const updatedForm: ProcurementForm = {
      ...form,
      versions: [...form.versions, nextVersion],
      currentVersion: nextVersion.version,
      updatedAt: todayIso(),
    }
    const { data: ver, error: verErr } = await supabase
      .from('form_versions')
      .insert(versionRow(formId, nextVersion))
      .select()
      .single()
    throwIfError(verErr)
    formVersionRecordId.current.set(`${formId}:${nextVersion.version}`, ver.id)
    setForms(fs => fs.map(f => (f.id === formId ? updatedForm : f)))
    const { error: formErr } = await supabase.from('forms').update(formRow(updatedForm)).eq('id', formId)
    if (formErr) setError(formErr.message)
  }

  async function createClient(name: string, loginId: string, password: string, barangayIds: string[]) {
    const data = await invokeAdminClients({ action: 'create', name, loginId, password, barangayIds })
    const id = String(data.id)
    setClients(cs => [{ id, name, loginId, active: true, barangayIds }, ...cs])
  }

  function updateClientBarangays(id: string, barangayIds: string[]) {
    setClients(cs => cs.map(c => (c.id === id ? { ...c, barangayIds } : c)))
    ;(async () => {
      const { error: delErr } = await supabase.from('client_barangays').delete().eq('client_id', id)
      if (delErr) {
        setError(delErr.message)
        return
      }
      if (barangayIds.length) {
        const { error: insErr } = await supabase
          .from('client_barangays')
          .insert(barangayIds.map(barangay_id => ({ client_id: id, barangay_id })))
        if (insErr) setError(insErr.message)
      }
    })()
  }

  function updateClientPassword(id: string, password: string) {
    invokeAdminClients({ action: 'reset_password', id, password }).catch(e => setError(String(e)))
  }

  function toggleClientActive(id: string) {
    const current = clients.find(c => c.id === id)
    if (!current) return
    const active = !current.active
    setClients(cs => cs.map(c => (c.id === id ? { ...c, active } : c)))
    invokeAdminClients({ action: 'set_active', id, active }).catch(e => setError(String(e)))
  }

  async function createBarangay(name: string): Promise<string> {
    const { data, error: err } = await supabase.from('barangays').insert({ name }).select().single()
    throwIfError(err)
    setBarangays(bs => [...bs, { id: data.id, name }].sort((a, b) => a.name.localeCompare(b.name)))
    return data.id
  }

  function updateBarangayName(id: string, name: string) {
    setBarangays(bs => bs.map(b => (b.id === id ? { ...b, name } : b)))
    supabase
      .from('barangays')
      .update({ name })
      .eq('id', id)
      .then(({ error: e }) => {
        if (e) setError(e.message)
      })
  }

  function deleteBarangay(id: string) {
    setBarangays(bs => bs.filter(b => b.id !== id))
    setOfficials(os => os.filter(o => o.barangayId !== id))
    supabase
      .from('barangays')
      .delete()
      .eq('id', id)
      .then(({ error: e }) => {
        if (e) setError(e.message)
      })
  }

  async function createOfficial(barangayId: string, name: string, position: string) {
    const { data, error: err } = await supabase
      .from('officials')
      .insert({ barangay_id: barangayId, name, position })
      .select()
      .single()
    throwIfError(err)
    setOfficials(os => [...os, { id: data.id, barangayId, name, position: position as Official['position'] }])
  }

  function updateOfficial(id: string, patch: { name?: string; position?: string }) {
    setOfficials(os => os.map(o => (o.id === id ? ({ ...o, ...patch } as Official) : o)))
    const fields: Record<string, unknown> = {}
    if (patch.name !== undefined) fields.name = patch.name
    if (patch.position !== undefined) fields.position = patch.position
    supabase
      .from('officials')
      .update(fields)
      .eq('id', id)
      .then(({ error: e }) => {
        if (e) setError(e.message)
      })
  }

  function deleteOfficial(id: string) {
    setOfficials(os => os.filter(o => o.id !== id))
    supabase
      .from('officials')
      .delete()
      .eq('id', id)
      .then(({ error: e }) => {
        if (e) setError(e.message)
      })
  }

  async function createSubmission(input: Omit<Submission, 'id'>): Promise<string> {
    const formVerRecId = formVersionRecordId.current.get(`${input.formId}:${input.formVersion}`)
    if (!formVerRecId) throw new Error('Form version record is missing — save the form and try again.')
    const { data, error: err } = await supabase
      .from('submissions')
      .insert(submissionRow({ ...input, id: '' }, formVerRecId))
      .select()
      .single()
    throwIfError(err)
    setSubmissions(ss => [{ ...input, id: data.id }, ...ss])
    return data.id
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
      if (!formVerRecId) {
        setError('Form version record is missing — save the form and try again.')
        return
      }
      supabase
        .from('submissions')
        .update(submissionRow(next!, formVerRecId))
        .eq('id', id)
        .then(({ error: e }) => {
          if (e) setError(e.message)
        })
    })
  }

  function deleteSubmission(id: string) {
    setSubmissions(ss => ss.filter(s => s.id !== id))
    supabase
      .from('submissions')
      .delete()
      .eq('id', id)
      .then(({ error: e }) => {
        if (e) setError(e.message)
      })
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

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}

export function useAppData() {
  const ctx = useContext(DataCtx)
  if (!ctx) throw new Error('useAppData must be used within DataProvider')
  return ctx
}
