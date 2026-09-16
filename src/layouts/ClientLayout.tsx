import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Seal from '../components/Seal'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/client', label: 'Dashboard', end: true },
  { to: '/client/new', label: 'New Form' },
  { to: '/client/submissions', label: 'My Submissions' },
]

export default function ClientLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-canvas">
      <header className="h-16 border-b border-line bg-white flex items-center px-6 gap-8">
        <div className="flex items-center gap-3">
          <Seal size={26} />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">Bulan Procurement</div>
            <div className="text-[11px] text-ink/50">Barangay Client Portal</div>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-sm2 text-[13.5px] transition-colors ${
                  isActive ? 'bg-bottle-600 text-white' : 'text-ink/70 hover:bg-paper'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[13px] text-ink/60">{session?.name}</span>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="focus-ring text-[13px] text-ink/60 hover:text-clay transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
