import React, { createContext, useContext, useState } from 'react'
import type { Role, Client } from './types'

interface Session {
  role: Role
  name: string
  clientId?: string
}

interface AuthCtx {
  session: Session | null
  loginAsAdmin: () => void
  /** Caller resolves the Client (e.g. from useAirtableData().clients) and passes it in. */
  loginAsClient: (client: Client) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)

  const loginAsAdmin = () => setSession({ role: 'admin', name: 'Admin' })

  const loginAsClient = (client: Client) => {
    setSession({ role: 'client', name: client.name, clientId: client.id })
  }

  const logout = () => setSession(null)

  return (
    <Ctx.Provider value={{ session, loginAsAdmin, loginAsClient, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
