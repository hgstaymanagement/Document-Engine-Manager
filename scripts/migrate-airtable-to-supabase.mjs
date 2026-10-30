/**
 * One-time copy of the Airtable base into Supabase.
 *
 * Required env (also reads .env / .env.migrate if present):
 *   AIRTABLE_TOKEN (or VITE_AIRTABLE_TOKEN)
 *   AIRTABLE_BASE_ID (or VITE_AIRTABLE_BASE_ID)
 *   SUPABASE_URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL (or VITE_ADMIN_EMAIL)
 *   ADMIN_PASSWORD
 *
 * Usage: npm run migrate:airtable
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i < 0) continue
    const key = trimmed.slice(0, i).trim()
    let value = trimmed.slice(i + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '.env.migrate'))

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || process.env.VITE_AIRTABLE_TOKEN
const BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID || 'appualgH3NCJzKMz3'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const LOGIN_EMAIL_DOMAIN = 'liga-bulan.example.com'

const TABLES = {
  barangays: 'tblsqJDGzXwzRkcPf',
  officials: 'tblb5CjugjeZvNv5I',
  clients: 'tblRgFiUN48xCMqDg',
  forms: 'tblCrfFF9EoZausyt',
  formVersions: 'tblFm6LWzBSkwObxY',
  submissions: 'tblEe26zp4P8I1eqw',
}

const FIELDS = {
  barangays: { name: 'fld1Bp6ZURD8gXBVT' },
  officials: {
    name: 'fldoekX8ho7exr9om',
    position: 'fldoUIau533eWP0Fy',
    barangay: 'fldvCrpMprbND2nt6',
  },
  clients: {
    name: 'fldtag7b1NkJRCwUo',
    loginId: 'fldyAS04tvzQIYir2',
    password: 'fldRnHoRGCFX5F13y',
    active: 'fld2Iy4i4YQkGOfOX',
    assignedBarangays: 'fldwhIppCWA14ryNg',
  },
  forms: {
    name: 'fldi5oTHtKGEDF0dL',
    description: 'fldhm7bBJM2aVyfMo',
    category: 'fldsWYzz2ULfVrDOd',
    published: 'fldgbC9EkF3KC7fCv',
    currentVersion: 'fldqolaHUwuaa8eod',
    updatedAt: 'fldkwicCQ8F5isJ5U',
  },
  formVersions: {
    name: 'fldxmcxteUqHZ40k5',
    form: 'fldUDv9LJRwtB8GIk',
    version: 'fldDiPVTZuZdrKOuT',
    createdAt: 'fldA2VL1iiSy0PNwk',
    changeNote: 'fldvHDM3Vrqpik7of',
    pageSize: 'fld096Mgcgya5yQrH',
    orientation: 'fldo7wRrrhUXRd9vR',
    marginsJson: 'fldqwkK0DJc4D49BL',
    elementsJson: 'fldZicBCrubUoJmWw',
  },
  submissions: {
    name: 'fldDTqZXADXiASzyU',
    form: 'fldP4XyCbs4zln9Wz',
    formVersion: 'fldn1DcggvQk4863f',
    barangay: 'fldwqCZTG9Zb7vbOW',
    client: 'fldjusywx0MO9ozyD',
    status: 'fldIgVh60opQLnMM8',
    dataJson: 'fldb5DfWZprCrU7se',
    officialSnapshotJson: 'fldJORrPIJQccbEvs',
    createdAt: 'fldvqkSJ7FbvQZeRz',
    updatedAt: 'fld70WAEEeZngwBoB',
    submittedAt: 'fld4Nza9Oy7UqhrvD',
  },
}

function loginIdToEmail(loginId) {
  return `${loginId.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`
}

function field(rec, id) {
  return rec.fields?.[id]
}

function firstLink(rec, id) {
  const v = field(rec, id)
  return Array.isArray(v) && v.length ? v[0] : null
}

function parseJson(raw, fallback) {
  try {
    return JSON.parse(String(raw ?? ''))
  } catch {
    return fallback
  }
}

function dateOrToday(value) {
  const s = String(value ?? '').slice(0, 10)
  return s || new Date().toISOString().slice(0, 10)
}

async function listAll(tableId) {
  const all = []
  let offset
  do {
    const qs = new URLSearchParams({ pageSize: '100', returnFieldsByFieldId: 'true' })
    if (offset) qs.set('offset', offset)
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${qs}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    })
    if (!res.ok) {
      throw new Error(`Airtable GET ${tableId} failed (${res.status}): ${await res.text()}`)
    }
    const data = await res.json()
    all.push(...data.records)
    offset = data.offset
  } while (offset)
  return all
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function insertAll(supabase, table, rows) {
  for (const batch of chunk(rows, 50)) {
    const { error } = await supabase.from(table).insert(batch)
    if (error) throw new Error(`${table} insert failed: ${error.message}`)
  }
}

function requireEnv() {
  const missing = []
  if (!AIRTABLE_TOKEN) missing.push('AIRTABLE_TOKEN')
  if (!BASE_ID) missing.push('AIRTABLE_BASE_ID')
  if (!SUPABASE_URL) missing.push('SUPABASE_URL')
  if (!SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!ADMIN_EMAIL) missing.push('ADMIN_EMAIL')
  if (!ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD')
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(', ')}. See scripts/migrate-airtable-to-supabase.mjs.`)
  }
}

async function main() {
  requireEnv()
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log('Fetching Airtable tables…')
  const [brgyRecs, offRecs, cliRecs, formRecs, verRecs, subRecs] = await Promise.all([
    listAll(TABLES.barangays),
    listAll(TABLES.officials),
    listAll(TABLES.clients),
    listAll(TABLES.forms),
    listAll(TABLES.formVersions),
    listAll(TABLES.submissions),
  ])
  console.log(
    `Airtable: ${brgyRecs.length} barangays, ${offRecs.length} officials, ${cliRecs.length} clients, ${formRecs.length} forms, ${verRecs.length} versions, ${subRecs.length} submissions`
  )

  const barangayIds = new Map()
  const officialIds = new Map()
  const clientIds = new Map()
  const formIds = new Map()
  const versionIds = new Map()

  console.log('Creating admin auth user…')
  const { data: adminUser, error: adminErr } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'admin', name: 'Admin' },
  })
  if (adminErr && !String(adminErr.message).toLowerCase().includes('already')) {
    throw new Error(`Admin createUser failed: ${adminErr.message}`)
  }
  let adminId = adminUser?.user?.id
  if (!adminId) {
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    adminId = list.users.find(u => u.email === ADMIN_EMAIL)?.id
  }
  if (!adminId) throw new Error('Could not resolve admin user id')
  const { error: adminProfErr } = await supabase.from('profiles').upsert({
    id: adminId,
    role: 'admin',
    name: 'Admin',
    login_id: null,
    active: true,
  })
  if (adminProfErr) throw new Error(`Admin profile: ${adminProfErr.message}`)

  const barangayRows = brgyRecs.map(rec => {
    const id = randomUUID()
    barangayIds.set(rec.id, id)
    return { id, name: String(field(rec, FIELDS.barangays.name) ?? '').trim() || rec.id }
  })
  console.log(`Inserting ${barangayRows.length} barangays…`)
  await insertAll(supabase, 'barangays', barangayRows)

  const officialRows = []
  for (const rec of offRecs) {
    const barangayAt = firstLink(rec, FIELDS.officials.barangay)
    const barangay_id = barangayIds.get(barangayAt)
    if (!barangay_id) continue
    const id = randomUUID()
    officialIds.set(rec.id, id)
    officialRows.push({
      id,
      barangay_id,
      position: String(field(rec, FIELDS.officials.position) ?? ''),
      name: String(field(rec, FIELDS.officials.name) ?? ''),
    })
  }
  console.log(`Inserting ${officialRows.length} officials…`)
  await insertAll(supabase, 'officials', officialRows)

  const assignmentRows = []
  console.log(`Creating ${cliRecs.length} client auth users…`)
  for (const rec of cliRecs) {
    const loginId = String(field(rec, FIELDS.clients.loginId) ?? '').trim()
    const password = String(field(rec, FIELDS.clients.password) ?? '')
    const name = String(field(rec, FIELDS.clients.name) ?? loginId)
    if (!loginId || !password) {
      console.warn(`Skipping client ${rec.id} (missing loginId or password)`)
      continue
    }
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: loginIdToEmail(loginId),
      password,
      email_confirm: true,
      user_metadata: { name, login_id: loginId, role: 'client' },
    })
    if (createErr || !created.user) {
      console.warn(`Client ${loginId}: ${createErr?.message ?? 'createUser failed'}`)
      continue
    }
    clientIds.set(rec.id, created.user.id)
    const { error: profErr } = await supabase.from('profiles').insert({
      id: created.user.id,
      role: 'client',
      name,
      login_id: loginId,
      active: Boolean(field(rec, FIELDS.clients.active)),
    })
    if (profErr) throw new Error(`profile ${loginId}: ${profErr.message}`)
    const assigned = field(rec, FIELDS.clients.assignedBarangays)
    if (Array.isArray(assigned)) {
      for (const atId of assigned) {
        const barangay_id = barangayIds.get(atId)
        if (barangay_id) assignmentRows.push({ client_id: created.user.id, barangay_id })
      }
    }
  }
  console.log(`Inserting ${assignmentRows.length} client_barangays…`)
  await insertAll(supabase, 'client_barangays', assignmentRows)

  const formRows = formRecs.map(rec => {
    const id = randomUUID()
    formIds.set(rec.id, id)
    return {
      id,
      name: String(field(rec, FIELDS.forms.name) ?? 'Untitled Form'),
      description: String(field(rec, FIELDS.forms.description) ?? ''),
      category: String(field(rec, FIELDS.forms.category) ?? 'Procurement'),
      published: Boolean(field(rec, FIELDS.forms.published)),
      current_version: Number(field(rec, FIELDS.forms.currentVersion) ?? 1),
      updated_at: dateOrToday(field(rec, FIELDS.forms.updatedAt)),
    }
  })
  console.log(`Inserting ${formRows.length} forms…`)
  await insertAll(supabase, 'forms', formRows)

  const versionRows = []
  for (const rec of verRecs) {
    const formAt = firstLink(rec, FIELDS.formVersions.form)
    const form_id = formIds.get(formAt)
    if (!form_id) continue
    const id = randomUUID()
    versionIds.set(rec.id, id)
    let margins = { top: 20, right: 18, bottom: 20, left: 18 }
    const parsedMargins = parseJson(field(rec, FIELDS.formVersions.marginsJson), null)
    if (parsedMargins && typeof parsedMargins === 'object') margins = parsedMargins
    const elements = parseJson(field(rec, FIELDS.formVersions.elementsJson), [])
    versionRows.push({
      id,
      form_id,
      version: Number(field(rec, FIELDS.formVersions.version) ?? 1),
      created_at: dateOrToday(field(rec, FIELDS.formVersions.createdAt)),
      change_note: field(rec, FIELDS.formVersions.changeNote)
        ? String(field(rec, FIELDS.formVersions.changeNote))
        : null,
      page_size: field(rec, FIELDS.formVersions.pageSize) || 'Letter',
      orientation: field(rec, FIELDS.formVersions.orientation) || 'portrait',
      margins,
      elements: Array.isArray(elements) ? elements : [],
    })
  }
  console.log(`Inserting ${versionRows.length} form_versions…`)
  await insertAll(supabase, 'form_versions', versionRows)

  const submissionRows = []
  for (const rec of subRecs) {
    const form_id = formIds.get(firstLink(rec, FIELDS.submissions.form))
    const form_version_id = versionIds.get(firstLink(rec, FIELDS.submissions.formVersion))
    const barangay_id = barangayIds.get(firstLink(rec, FIELDS.submissions.barangay))
    const client_id = clientIds.get(firstLink(rec, FIELDS.submissions.client))
    if (!form_id || !form_version_id || !barangay_id || !client_id) {
      console.warn(`Skipping submission ${rec.id} (missing link)`)
      continue
    }
    const parsed = parseJson(field(rec, FIELDS.submissions.dataJson), {})
    let data = {}
    let tables = {}
    if (parsed && typeof parsed === 'object' && ('values' in parsed || 'tables' in parsed)) {
      data = parsed.values ?? {}
      tables = parsed.tables ?? {}
    } else {
      data = parsed ?? {}
    }
    submissionRows.push({
      id: randomUUID(),
      form_id,
      form_version_id,
      barangay_id,
      client_id,
      status: field(rec, FIELDS.submissions.status) === 'Submitted' ? 'submitted' : 'draft',
      data,
      tables,
      official_snapshot: parseJson(field(rec, FIELDS.submissions.officialSnapshotJson), {}),
      created_at: dateOrToday(field(rec, FIELDS.submissions.createdAt)),
      updated_at: dateOrToday(field(rec, FIELDS.submissions.updatedAt)),
      submitted_at: field(rec, FIELDS.submissions.submittedAt)
        ? dateOrToday(field(rec, FIELDS.submissions.submittedAt))
        : null,
    })
  }
  console.log(`Inserting ${submissionRows.length} submissions…`)
  await insertAll(supabase, 'submissions', submissionRows)

  console.log(`Done. Mapped ${officialIds.size} officials. Sign in with ${ADMIN_EMAIL} / ADMIN_PASSWORD.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
