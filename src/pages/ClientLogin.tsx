import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginShell from '../components/LoginShell'
import { Button, Field, inputCls } from '../components/ui'
import { useAuth } from '../lib/auth'

export default function ClientLogin() {
  const { loginAsClient } = useAuth()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await loginAsClient(loginId, password)
      navigate('/client')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <LoginShell role="client">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Login ID">
          <input
            autoFocus
            value={loginId}
            onChange={e => setLoginId(e.target.value)}
            placeholder=""
            className={inputCls}
          />
        </Field>

        <Field label="Password" hint="Set or reset by an admin from the Clients page.">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>

        {error && <p className="text-[12.5px] text-clay">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full justify-center py-2.5">
          Sign in
        </Button>
      </form>
    </LoginShell>
  )
}
