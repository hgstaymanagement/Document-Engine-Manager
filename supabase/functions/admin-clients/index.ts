import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOGIN_EMAIL_DOMAIN = 'liga-bulan.example.com'

function loginIdToEmail(loginId: string) {
  return `${loginId.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader = req.headers.get('Authorization') ?? ''

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401)

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  if (profileErr || profile?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const action = String(body.action ?? '')

  if (action === 'create') {
    const name = String(body.name ?? '').trim()
    const loginId = String(body.loginId ?? '').trim()
    const password = String(body.password ?? '')
    const barangayIds = Array.isArray(body.barangayIds) ? body.barangayIds.map(String) : []
    if (!name || !loginId || !password) return json({ error: 'name, loginId, and password are required' }, 400)

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: loginIdToEmail(loginId),
      password,
      email_confirm: true,
      user_metadata: { name, login_id: loginId, role: 'client' },
    })
    if (createErr || !created.user) return json({ error: createErr?.message ?? 'Could not create user' }, 400)

    const { error: profInsErr } = await admin.from('profiles').insert({
      id: created.user.id,
      role: 'client',
      name,
      login_id: loginId,
      active: true,
    })
    if (profInsErr) {
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: profInsErr.message }, 400)
    }

    if (barangayIds.length) {
      const { error: assignErr } = await admin
        .from('client_barangays')
        .insert(barangayIds.map(barangay_id => ({ client_id: created.user.id, barangay_id })))
      if (assignErr) {
        await admin.from('profiles').delete().eq('id', created.user.id)
        await admin.auth.admin.deleteUser(created.user.id)
        return json({ error: assignErr.message }, 400)
      }
    }

    return json({ id: created.user.id })
  }

  if (action === 'reset_password') {
    const id = String(body.id ?? '')
    const password = String(body.password ?? '')
    if (!id || !password) return json({ error: 'id and password are required' }, 400)
    const { error } = await admin.auth.admin.updateUserById(id, { password })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (action === 'set_active') {
    const id = String(body.id ?? '')
    const active = Boolean(body.active)
    if (!id) return json({ error: 'id is required' }, 400)
    const { error } = await admin.from('profiles').update({ active }).eq('id', id)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  return json({ error: `Unknown action: ${action}` }, 400)
})
