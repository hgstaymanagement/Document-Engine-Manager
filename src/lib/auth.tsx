import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Role } from './types'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { loginIdToEmail } from './loginEmail'

interface Session {
  role: Role
  name: string
  clientId?: string
}

interface AuthCtx {
  session: Session | null
  authReady: boolean
  loginAsAdmin: (password: string) => Promise<void>
  loginAsClient: (loginId: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

async function sessionFromUserId(userId: string): Promise<Session> {
  const { data, error } = await supabase.from('profiles').select('id, role, name, active').eq('id', userId).single()
  if (error || !data) throw new Error('This account has no profile. Ask an admin to recreate it.')
  if (data.role === 'client' && !data.active) {
    await supabase.auth.signOut()
    throw new Error('This account is inactive.')
  }
  if (data.role !== 'admin' && data.role !== 'client') {
    await supabase.auth.signOut()
    throw new Error('Unknown account role.')
  }
  return {
    role: data.role,
    name: data.name,
    clientId: data.role === 'client' ? data.id : undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    let cancelled = false

    supabase.auth.getSession().then(async ({ data }) => {
      try {
        if (data.session?.user) {
          const next = await sessionFromUserId(data.session.user.id)
          if (!cancelled) setSession(next)
        }
      } catch {
        if (!cancelled) setSession(null)
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!authSession?.user) {
        setSession(null)
        return
      }
      try {
        setSession(await sessionFromUserId(authSession.user.id))
      } catch {
        setSession(null)
      }
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const loginAsAdmin = async (password: string) => {
    const email = import.meta.env.VITE_ADMIN_EMAIL as string | undefined
    if (!email) throw new Error('VITE_ADMIN_EMAIL is not set — add it to .env and restart the dev server.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Incorrect password.')
    const { data } = await supabase.auth.getUser()
    if (!data.user) throw new Error('Incorrect password.')
    const next = await sessionFromUserId(data.user.id)
    if (next.role !== 'admin') {
      await supabase.auth.signOut()
      throw new Error('This account is not an admin.')
    }
    setSession(next)
  }

  const loginAsClient = async (loginId: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: loginIdToEmail(loginId),
      password,
    })
    if (error) throw new Error('Incorrect login ID or password.')
    const { data } = await supabase.auth.getUser()
    if (!data.user) throw new Error('Incorrect login ID or password.')
    const next = await sessionFromUserId(data.user.id)
    if (next.role !== 'client') {
      await supabase.auth.signOut()
      throw new Error('This account is not a client.')
    }
    setSession(next)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <Ctx.Provider value={{ session, authReady, loginAsAdmin, loginAsClient, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
