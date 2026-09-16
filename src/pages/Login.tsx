import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Seal from '../components/Seal'
import { useAuth } from '../lib/auth'
import { useAirtableData } from '../lib/airtableStore'

export default function Login() {
  const { loginAsAdmin, loginAsClient } = useAuth()
  const { clients } = useAirtableData()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'admin' | 'client'>('client')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'admin') {
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined
      if (!adminPassword) {
        setError('VITE_ADMIN_PASSWORD is not set — add it to .env and restart the dev server.')
        return
      }
      if (password !== adminPassword) {
        setError('Incorrect password.')
        return
      }
      loginAsAdmin()
      navigate('/admin')
      return
    }
    const match = clients.find(c => c.loginId.toLowerCase() === loginId.trim().toLowerCase() && c.active)
    if (!match) {
      setError('We could not find an active account with that login ID.')
      return
    }
    if (password !== match.password) {
      setError('Incorrect password.')
      return
    }
    loginAsClient(match)
    navigate('/client')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Seal size={56} />
          <h1 className="mt-4 text-[19px] font-semibold text-center leading-snug">
            LIGA Bulan
            <br />
            Document Engine Manager
          </h1>
          <p className="mt-1.5 text-[13px] text-ink/55">Municipality of Bulan, Sorsogon</p>
        </div>

        <div className="bg-white border border-line shadow-doc rounded-sm2 p-7">
          <div className="flex mb-6 border border-line rounded-sm2 overflow-hidden text-[13px]">
            <button
              type="button"
              onClick={() => {
                setMode('client')
                setPassword('')
                setError('')
              }}
              className={`flex-1 py-2 transition-colors ${mode === 'client' ? 'bg-bottle-600 text-white' : 'bg-white text-ink/60 hover:bg-paper'}`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('admin')
                setPassword('')
                setError('')
              }}
              className={`flex-1 py-2 transition-colors ${mode === 'admin' ? 'bg-bottle-600 text-white' : 'bg-white text-ink/60 hover:bg-paper'}`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'client' ? (
              <>
                <div>
                  <label className="block text-[12.5px] text-ink/60 mb-1.5">Login ID</label>
                  <input
                    autoFocus
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    placeholder="e.g. kgolpo"
                    className="focus-ring w-full border border-line rounded-sm2 px-3 py-2 text-[14px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] text-ink/60 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="focus-ring w-full border border-line rounded-sm2 px-3 py-2 text-[14px] bg-white"
                  />
                  <p className="mt-1.5 text-[11.5px] text-ink/40">Set or reset by an admin from the Clients page.</p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[12.5px] text-ink/60 mb-1.5">Password</label>
                <input
                  autoFocus
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring w-full border border-line rounded-sm2 px-3 py-2 text-[14px] bg-white"
                />
              </div>
            )}

            {error && <p className="text-[12.5px] text-clay">{error}</p>}

            <button
              type="submit"
              className="focus-ring w-full bg-bottle-600 hover:bg-bottle-700 text-white text-[13.5px] font-medium py-2.5 rounded-sm2 transition-colors"
            >
              {mode === 'admin' ? 'Enter admin console' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11.5px] text-ink/40">
          Barangay, official, and account records are synced live with Airtable.
        </p>
      </div>
    </div>
  )
}
