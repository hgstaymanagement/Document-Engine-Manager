import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Seal from '../components/Seal'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/barangays', label: 'Barangays' },
  { to: '/admin/forms', label: 'Forms' },
  { to: '/admin/submissions', label: 'Submissions' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-canvas">
      <aside className="w-60 shrink-0 border-r border-line bg-white flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-line">
          <Seal size={30} />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">LIGA Bulan</div>
            <div className="text-[11px] text-ink/50">Document Engine Manager</div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-5 py-2.5 text-[13.5px] border-l-2 transition-colors ${
                  isActive
                    ? 'border-bottle-600 text-bottle-700 bg-bottle-50 font-medium'
                    : 'border-transparent text-ink/70 hover:text-ink hover:bg-paper'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-line">
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="focus-ring w-full text-left text-[13px] text-ink/60 hover:text-clay transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
