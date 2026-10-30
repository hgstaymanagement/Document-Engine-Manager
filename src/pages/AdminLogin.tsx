import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginShell from '../components/LoginShell'
import { Button, Field, inputCls } from '../components/ui'
import { useAuth } from '../lib/auth'

export default function AdminLogin() {
  const { loginAsAdmin } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await loginAsAdmin(password)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <LoginShell role="admin">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Password">
          <input
            autoFocus
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>

        {error && <p className="text-[12.5px] text-clay">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full justify-center py-2.5">
          Enter admin console
        </Button>
      </form>
    </LoginShell>
  )
}
