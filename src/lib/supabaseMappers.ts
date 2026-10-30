import type { Barangay, Official, Client, ProcurementForm, FormVersion, Submission } from './types'
import { generateId } from './uniqueId'

export interface DbBarangay {
  id: string
  name: string
}

export interface DbOfficial {
  id: string
  barangay_id: string
  position: string
  name: string
}

export interface DbProfile {
  id: string
  role: 'admin' | 'client'
  name: string
  login_id: string | null
  active: boolean
}

export interface DbClientBarangay {
  client_id: string
  barangay_id: string
}

export interface DbForm {
  id: string
  name: string
  description: string
  category: string
  published: boolean
  current_version: number
  updated_at: string
}

export interface DbFormVersion {
  id: string
  form_id: string
  version: number
  created_at: string
  change_note: string | null
  page_size: string
  orientation: string
  margins: FormVersion['page']['margins']
  elements: FormVersion['elements']
}

export interface DbSubmission {
  id: string
  form_id: string
  form_version_id: string
  barangay_id: string
  client_id: string
  status: 'draft' | 'submitted'
  data: Submission['data']
  tables: Submission['tables']
  official_snapshot: Submission['officialSnapshot']
  created_at: string
  updated_at: string
  submitted_at: string | null
}

export function mapBarangay(row: DbBarangay): Barangay {
  return { id: row.id, name: row.name }
}

export function mapOfficial(row: DbOfficial): Official {
  return {
    id: row.id,
    barangayId: row.barangay_id,
    position: row.position as Official['position'],
    name: row.name,
  }
}

export function mapClients(profiles: DbProfile[], assignments: DbClientBarangay[]): Client[] {
  const byClient = new Map<string, string[]>()
  for (const a of assignments) {
    const list = byClient.get(a.client_id) ?? []
    list.push(a.barangay_id)
    byClient.set(a.client_id, list)
  }
  return profiles
    .filter(p => p.role === 'client')
    .map(p => ({
      id: p.id,
      name: p.name,
      loginId: p.login_id ?? '',
      active: p.active,
      barangayIds: byClient.get(p.id) ?? [],
    }))
}

/**
 * Repairs data from before the element-id generator was fixed: duplicate
 * element ids get a fresh id so builder lookups and React keys stay unique.
 */
function dedupeElementIds(elements: FormVersion['elements']): FormVersion['elements'] {
  const seen = new Set<string>()
  return elements.map(el => {
    if (!seen.has(el.id)) {
      seen.add(el.id)
      return el
    }
    const newId = generateId('el')
    seen.add(newId)
    return { ...el, id: newId }
  })
}

export interface RawFormVersion {
  recordId: string
  formId: string
  version: FormVersion
}

export function mapFormVersion(row: DbFormVersion): RawFormVersion {
  const margins = row.margins ?? { top: 20, right: 18, bottom: 20, left: 18 }
  const elements = Array.isArray(row.elements) ? row.elements : []
  return {
    recordId: row.id,
    formId: row.form_id,
    version: {
      version: Number(row.version ?? 1),
      createdAt: String(row.created_at ?? ''),
      changeNote: row.change_note ?? undefined,
      page: {
        size: (row.page_size as FormVersion['page']['size']) ?? 'Letter',
        orientation: (row.orientation as FormVersion['page']['orientation']) ?? 'portrait',
        margins,
      },
      elements: dedupeElementIds(elements),
    },
  }
}

export function assembleForms(formRows: DbForm[], rawVersions: RawFormVersion[]): ProcurementForm[] {
  return formRows.map(row => {
    const versions = rawVersions
      .filter(v => v.formId === row.id)
      .sort((a, b) => a.version.version - b.version.version)
      .map(v => v.version)
    return {
      id: row.id,
      name: row.name ?? '',
      description: row.description ?? '',
      category: row.category ?? 'Procurement',
      currentVersion: Number(row.current_version ?? versions.length),
      published: Boolean(row.published),
      updatedAt: String(row.updated_at ?? ''),
      versions: versions.length
        ? versions
        : [
            {
              version: 1,
              createdAt: new Date().toISOString().slice(0, 10),
              page: { size: 'Letter', orientation: 'portrait', margins: { top: 20, right: 18, bottom: 20, left: 18 } },
              elements: [],
            },
          ],
    }
  })
}

export function versionNumberByRecordId(rawVersions: RawFormVersion[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const v of rawVersions) m.set(v.recordId, v.version.version)
  return m
}

export function mapSubmission(row: DbSubmission, versionNumbers: Map<string, number>): Submission {
  return {
    id: row.id,
    formId: row.form_id,
    formVersion: versionNumbers.get(row.form_version_id) ?? 1,
    barangayId: row.barangay_id,
    clientId: row.client_id,
    status: row.status === 'submitted' ? 'submitted' : 'draft',
    data: row.data ?? {},
    tables: row.tables ?? {},
    officialSnapshot: row.official_snapshot ?? {},
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
    submittedAt: row.submitted_at ?? undefined,
  }
}
