import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index < 0) continue
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function normalizedName(name) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function throwIfError(error) {
  if (error) throw new Error(error.message)
}

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '.env.migrate'))

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRoleKey) throw new Error('Missing Supabase URL or service-role key.')

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const [barangayResult, officialResult, assignmentResult, submissionResult] = await Promise.all([
  supabase.from('barangays').select('id, name').order('name'),
  supabase.from('officials').select('id, barangay_id'),
  supabase.from('client_barangays').select('client_id, barangay_id'),
  supabase.from('submissions').select('id, barangay_id'),
])

for (const result of [barangayResult, officialResult, assignmentResult, submissionResult]) {
  throwIfError(result.error)
}

const references = new Map()
for (const row of [...officialResult.data, ...assignmentResult.data, ...submissionResult.data]) {
  references.set(row.barangay_id, (references.get(row.barangay_id) ?? 0) + 1)
}

const byName = new Map()
for (const barangay of barangayResult.data) {
  const group = byName.get(normalizedName(barangay.name)) ?? []
  group.push(barangay)
  byName.set(normalizedName(barangay.name), group)
}

const duplicateGroups = [...byName.values()].filter(group => group.length > 1)
const keeperAssignmentKeys = new Set(assignmentResult.data.map(row => `${row.client_id}:${row.barangay_id}`))
let deleted = 0
let movedReferences = 0

for (const group of duplicateGroups) {
  const [keeper, ...duplicates] = [...group].sort(
    (left, right) => (references.get(right.id) ?? 0) - (references.get(left.id) ?? 0) || left.id.localeCompare(right.id)
  )

  for (const duplicate of duplicates) {
    const duplicateAssignments = assignmentResult.data.filter(row => row.barangay_id === duplicate.id)
    for (const assignment of duplicateAssignments) {
      const keeperKey = `${assignment.client_id}:${keeper.id}`
      if (keeperAssignmentKeys.has(keeperKey)) {
        const { error } = await supabase
          .from('client_barangays')
          .delete()
          .eq('client_id', assignment.client_id)
          .eq('barangay_id', duplicate.id)
        throwIfError(error)
      } else {
        const { error } = await supabase
          .from('client_barangays')
          .update({ barangay_id: keeper.id })
          .eq('client_id', assignment.client_id)
          .eq('barangay_id', duplicate.id)
        throwIfError(error)
        keeperAssignmentKeys.add(keeperKey)
      }
      movedReferences += 1
    }

    for (const table of ['officials', 'submissions']) {
      const { error } = await supabase.from(table).update({ barangay_id: keeper.id }).eq('barangay_id', duplicate.id)
      throwIfError(error)
    }

    movedReferences += officialResult.data.filter(row => row.barangay_id === duplicate.id).length
    movedReferences += submissionResult.data.filter(row => row.barangay_id === duplicate.id).length

    const { error } = await supabase.from('barangays').delete().eq('id', duplicate.id)
    throwIfError(error)
    deleted += 1
  }
}

console.log(`Merged ${duplicateGroups.length} duplicate name groups, moved ${movedReferences} linked records, and removed ${deleted} duplicate barangays.`)
