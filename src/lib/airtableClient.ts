import { BASE_ID } from './airtableConfig'

const TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN as string | undefined
const API_ROOT = 'https://api.airtable.com/v0'

export interface AirtableRecord<F = Record<string, unknown>> {
  id: string
  fields: F
  createdTime?: string
}

class AirtableConfigError extends Error {
  constructor() {
    super(
      'VITE_AIRTABLE_TOKEN is not set. Copy .env.example to .env and add a Personal Access Token ' +
        '(https://airtable.com/create/tokens) with data.records:read/write on this base.'
    )
    this.name = 'AirtableConfigError'
  }
}

function assertConfigured() {
  if (!TOKEN) throw new AirtableConfigError()
}

async function request(path: string, init?: RequestInit) {
  assertConfigured()
  const res = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Airtable ${init?.method ?? 'GET'} ${path} failed (${res.status}): ${body}`)
  }
  return res.json()
}

/** Fetch every record in a table, following pagination automatically. */
export async function listAll<F = Record<string, unknown>>(tableId: string): Promise<AirtableRecord<F>[]> {
  const all: AirtableRecord<F>[] = []
  let offset: string | undefined
  do {
    // returnFieldsByFieldId=true keeps `fields` keyed by field ID (e.g.
    // "fldtag7b1NkJRCwUo") instead of Airtable's default of keying by field
    // NAME (e.g. "Name") — every mapper in this app reads fields by ID, and
    // create/update below request the same, so this must match everywhere
    // or a fresh fetch silently returns records that map to all-blank values.
    const qs = offset
      ? `?pageSize=100&returnFieldsByFieldId=true&offset=${offset}`
      : '?pageSize=100&returnFieldsByFieldId=true'
    const data = await request(`/${BASE_ID}/${tableId}${qs}`)
    all.push(...data.records)
    offset = data.offset
  } while (offset)
  return all
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Create records, batching into groups of 10 (the Airtable API's per-request limit). */
export async function createRecords<F = Record<string, unknown>>(
  tableId: string,
  records: { fields: Partial<F> }[]
): Promise<AirtableRecord<F>[]> {
  const results: AirtableRecord<F>[] = []
  for (const batch of chunk(records, 10)) {
    const data = await request(`/${BASE_ID}/${tableId}`, {
      method: 'POST',
      body: JSON.stringify({ records: batch, returnFieldsByFieldId: true }),
    })
    results.push(...data.records)
  }
  return results
}

/** Update records (partial field patches), batching into groups of 10. */
export async function updateRecords<F = Record<string, unknown>>(
  tableId: string,
  records: { id: string; fields: Partial<F> }[]
): Promise<AirtableRecord<F>[]> {
  const results: AirtableRecord<F>[] = []
  for (const batch of chunk(records, 10)) {
    const data = await request(`/${BASE_ID}/${tableId}`, {
      method: 'PATCH',
      body: JSON.stringify({ records: batch, returnFieldsByFieldId: true }),
    })
    results.push(...data.records)
  }
  return results
}

export async function deleteRecords(tableId: string, ids: string[]): Promise<void> {
  for (const batch of chunk(ids, 10)) {
    const qs = batch.map(id => `records[]=${id}`).join('&')
    await request(`/${BASE_ID}/${tableId}?${qs}`, { method: 'DELETE' })
  }
}

export const isAirtableConfigured = () => Boolean(TOKEN)
