import { Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import type { Role } from './types'

export default function ProtectedRoute({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/" replace />
  if (session.role !== role) return <Navigate to={session.role === 'admin' ? '/admin' : '/client'} replace />
  return <>{children}</>
}
