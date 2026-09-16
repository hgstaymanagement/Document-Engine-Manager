import { FIELDS } from './airtableConfig'
import type { AirtableRecord } from './airtableClient'
import type { Barangay, Official, Client, ProcurementForm, FormVersion, Submission } from './types'

const F = FIELDS

export function mapBarangay(rec: AirtableRecord<Record<string, unknown>>): Barangay {
  return { id: rec.id, name: String(rec.fields[F.barangays.name] ?? '') }
}

export function mapOfficial(rec: AirtableRecord<Record<string, unknown>>): Official {
  const barangayLinks = (rec.fields[F.officials.barangay] as string[] | undefined) ?? []
  return {
    id: rec.id,
    barangayId: barangayLinks[0] ?? '',
    position: String(rec.fields[F.officials.position] ?? '') as Official['position'],
    name: String(rec.fields[F.officials.name] ?? ''),
  }
}

export function mapClient(rec: AirtableRecord<Record<string, unknown>>): Client {
  return {
    id: rec.id,
    name: String(rec.fields[F.clients.name] ?? ''),
    loginId: String(rec.fields[F.clients.loginId] ?? ''),
    password: String(rec.fields[F.clients.password] ?? ''),
    active: Boolean(rec.fields[F.clients.active]),
    barangayIds: (rec.fields[F.clients.assignedBarangays] as string[] | undefined) ?? [],
  }
}

/** A Form Version record plus the bits needed to place it under its parent Form. */
export interface RawFormVersion {
  recordId: string
  formRecordId: string
  version: FormVersion
}

export function mapFormVersion(rec: AirtableRecord<Record<string, unknown>>): RawFormVersion {
  const formLinks = (rec.fields[F.formVersions.form] as string[] | undefined) ?? []
  let elements: FormVersion['elements'] = []
  let margins = { top: 20, right: 18, bottom: 20, left: 18 }
  try {
    elements = JSON.parse(String(rec.fields[F.formVersions.elementsJson] ?? '[]'))
  } catch {
    elements = []
  }
  try {
    margins = JSON.parse(String(rec.fields[F.formVersions.marginsJson] ?? '{}'))
  } catch {
    // keep default
  }
  return {
    recordId: rec.id,
    formRecordId: formLinks[0] ?? '',
    version: {
      version: Number(rec.fields[F.formVersions.version] ?? 1),
      createdAt: String(rec.fields[F.formVersions.createdAt] ?? ''),
      changeNote: rec.fields[F.formVersions.changeNote] ? String(rec.fields[F.formVersions.changeNote]) : undefined,
      page: {
        size: (rec.fields[F.formVersions.pageSize] as FormVersion['page']['size']) ?? 'Letter',
        orientation: (rec.fields[F.formVersions.orientation] as FormVersion['page']['orientation']) ?? 'portrait',
        margins,
      },
      elements,
    },
  }
}

/** Assemble Form records + their Form Version records into full ProcurementForm objects. */
export function assembleForms(
  formRecords: AirtableRecord<Record<string, unknown>>[],
  rawVersions: RawFormVersion[]
): ProcurementForm[] {
  return formRecords.map(rec => {
    const versions = rawVersions
      .filter(v => v.formRecordId === rec.id)
      .sort((a, b) => a.version.version - b.version.version)
      .map(v => v.version)
    return {
      id: rec.id,
      name: String(rec.fields[F.forms.name] ?? ''),
      description: String(rec.fields[F.forms.description] ?? ''),
      category: String(rec.fields[F.forms.category] ?? 'Procurement'),
      currentVersion: Number(rec.fields[F.forms.currentVersion] ?? versions.length),
      published: Boolean(rec.fields[F.forms.published]),
      updatedAt: String(rec.fields[F.forms.updatedAt] ?? ''),
      versions: versions.length ? versions : [
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

/**
 * Submissions store the numeric formVersion in our app types, but Airtable
 * links to the specific Form Version record — this map (recordId -> version
 * number) resolves that link at read time, built once from the same
 * rawVersions list assembleForms() consumes.
 */
export function versionNumberByRecordId(rawVersions: RawFormVersion[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const v of rawVersions) m.set(v.recordId, v.version.version)
  return m
}

export function mapSubmission(
  rec: AirtableRecord<Record<string, unknown>>,
  versionNumbers: Map<string, number>
): Submission {
  const formLinks = (rec.fields[F.submissions.form] as string[] | undefined) ?? []
  const versionLinks = (rec.fields[F.submissions.formVersion] as string[] | undefined) ?? []
  const barangayLinks = (rec.fields[F.submissions.barangay] as string[] | undefined) ?? []
  const clientLinks = (rec.fields[F.submissions.client] as string[] | undefined) ?? []
  let data: Submission['data'] = {}
  let tables: Submission['tables'] = {}
  let officialSnapshot: Submission['officialSnapshot'] = {}
  try {
    const parsed = JSON.parse(String(rec.fields[F.submissions.dataJson] ?? '{}'))
    // Newer records store { values, tables }; older seed records stored the
    // flat field-value object directly — accept both so nothing already in
    // the base needs to be migrated.
    if (parsed && typeof parsed === 'object' && ('values' in parsed || 'tables' in parsed)) {
      data = parsed.values ?? {}
      tables = parsed.tables ?? {}
    } else {
      data = parsed ?? {}
    }
  } catch {
    data = {}
  }
  try {
    officialSnapshot = JSON.parse(String(rec.fields[F.submissions.officialSnapshotJson] ?? '{}'))
  } catch {
    officialSnapshot = {}
  }
  return {
    id: rec.id,
    formId: formLinks[0] ?? '',
    formVersion: versionNumbers.get(versionLinks[0] ?? '') ?? 1,
    barangayId: barangayLinks[0] ?? '',
    clientId: clientLinks[0] ?? '',
    status: rec.fields[F.submissions.status] === 'Submitted' ? 'submitted' : 'draft',
    data,
    tables,
    officialSnapshot,
    createdAt: String(rec.fields[F.submissions.createdAt] ?? ''),
    updatedAt: String(rec.fields[F.submissions.updatedAt] ?? ''),
    submittedAt: rec.fields[F.submissions.submittedAt] ? String(rec.fields[F.submissions.submittedAt]) : undefined,
  }
}
