/**
 * Resets the Supabase Auth password for the configured admin account.
 *
 * Required env (also reads .env / .env.migrate):
 *   SUPABASE_URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL (or VITE_ADMIN_EMAIL)
 *   ADMIN_PASSWORD
 *
 * Usage: node scripts/reset-supabase-admin-password.mjs
 */
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

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '.env.migrate'))

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!url || !serviceRoleKey || !email || !password) {
  throw new Error('Missing Supabase URL, service-role key, admin email, or new admin password.')
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
if (listError) throw new Error(`Could not list Auth users: ${listError.message}`)

const admin = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase())
if (!admin) throw new Error(`No Auth user exists for the configured admin email.`)

const { error: updateError } = await supabase.auth.admin.updateUserById(admin.id, { password })
if (updateError) throw new Error(`Could not update admin password: ${updateError.message}`)

console.log('Admin password updated. You can now sign in to the app.')
