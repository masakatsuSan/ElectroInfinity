import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/admin',           label: 'Dashboard',  icon: '⊞', end: true },
  { to: '/admin/notices',   label: 'Notices',    icon: '◆' },
  { to: '/admin/faculty',   label: 'Faculty',    icon: '●' },
  { to: '/admin/resources', label: 'Resources',  icon: '◇' },
  { to: '/admin/events',    label: 'Events',     icon: '○' },
  { to: '/admin/deadlines', label: 'Deadlines',  icon: '◷' },
  { to: '/admin/routines',  label: 'Routine',    icon: '⊞' },
  { to: '/admin/students',  label: 'Students',   icon: '▪' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const availableLinks = LINKS.filter(l => {
    if (user?.role === 'cr') {
      return ['/admin', '/admin/notices', '/admin/resources', '/admin/events', '/admin/deadlines', '/admin/routines'].includes(l.to);
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-canvas text-ink pt-[48px]">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 md:min-h-[calc(100vh-48px)] border-b md:border-b-0 md:border-r border-divider-soft flex-shrink-0 bg-canvas z-10 flex flex-col">
        <div className="p-6 md:p-8 border-b border-divider-soft">
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.04em] text-[#696969] mb-2">{user?.role === 'cr' ? 'CR Panel' : 'Admin Panel'}</p>
          <p className="font-display font-medium text-[20px] tracking-tight text-ink truncate">{user?.name}</p>
          <p className="font-sans text-[14px] font-[450] text-ink-muted-80 mt-1 capitalize">{user?.role.replace('_', ' ')}</p>
        </div>

        <nav className="p-4 md:p-6 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible scrollbar-none">
          {availableLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 rounded-[20px] text-[15px] font-[450] whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-ink text-canvas shadow-sm'
                    : 'text-ink-muted-80 hover:text-ink hover:bg-surface-pearl border border-transparent'
                }`
              }
            >
              <span>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block p-6 mt-auto border-t border-divider-soft">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-5 py-3 text-[14px] font-[450] text-ink-muted-80 hover:text-ink hover:bg-surface-pearl rounded-[20px] transition-colors mb-2"
          >
            ← Back to site
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 text-[14px] font-[450] text-ink-muted-80 hover:text-[#CF4500] hover:bg-[#CF4500]/10 rounded-[20px] transition-colors text-left"
          >
            ⏻ Log out
          </button>
        </div>
      </aside>

      {/* ── Main content — each admin page renders here ── */}
      <main className="flex-1 p-6 md:p-10 overflow-x-hidden bg-canvas">
        <Outlet />
      </main>
    </div>
  )
}
