import { Navigate } from 'react-router-dom'
import { useAuth } from './auth'
<<<<<<< HEAD
import { useAppData } from './dataStore'
import type { Role } from './types'
import { LOADING_MESSAGE } from './branding'
import { Button, LoadingState } from '../components/ui'

const loginPath: Record<Role, string> = {
  admin: '/login/admin',
  client: '/login/client',
}

export default function ProtectedRoute({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session, authReady } = useAuth()

  if (!authReady) {
    return <LoadingState message={LOADING_MESSAGE} />
  }
  if (!session) return <Navigate to={loginPath[role]} replace />
  if (session.role !== role) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/client'} replace />
  }
  return <DataGate>{children}</DataGate>
}

function DataGate({ children }: { children: React.ReactNode }) {
  const { loading, error, refresh } = useAppData()

  if (loading) {
    return <LoadingState message={LOADING_MESSAGE} />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
        <div className="max-w-md text-center">
          <h1 className="text-[16px] font-semibold mb-2 text-clay">Couldn't load data from Supabase</h1>
          <p className="text-[13px] text-ink/60 leading-relaxed font-mono break-words">{error}</p>
          <Button onClick={refresh} className="mt-5">
            Try again
          </Button>
        </div>
      </div>
    )
  }

=======
import type { Role } from './types'

export default function ProtectedRoute({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/" replace />
  if (session.role !== role) return <Navigate to={session.role === 'admin' ? '/admin' : '/client'} replace />
>>>>>>> origin/main
  return <>{children}</>
}
