import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BackButton from '../../components/BackButton'

import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  UserCheck,
  FolderOpen,
  Clock,
  CalendarClock,
  Building2,
  BookOpen,
  Image,
  Mail,
  Hash,
  Code2,
  CalendarRange,
  Megaphone,
  Power,
  Award,
} from 'lucide-react'

const LINKS = [
  { to: '/admin',             label: 'Overview',             icon: LayoutDashboard, end: true },
  { to: '/admin/attendance',  label: 'Attendance & Faculty', icon: ClipboardCheck },
  { to: '/admin/faculty',     label: 'Faculty Directory',    icon: UserCheck },
  { to: '/admin/students',    label: 'Students',             icon: Users },
  { to: '/admin/labs',        label: 'Laboratories',         icon: Building2 },
  { to: '/admin/courses',     label: 'Courses',              icon: BookOpen },
  { to: '/admin/rooms',       label: 'Community Rooms',      icon: Hash },
  { to: '/admin/announcements', label: 'Announcements',      icon: Megaphone },
  { to: '/admin/resources',   label: 'Resources',            icon: FolderOpen },
  { to: '/admin/calendar',    label: 'Academic Calendar',    icon: CalendarRange },
  { to: '/admin/projects',    label: 'Projects',             icon: Code2 },
  { to: '/admin/gallery',     label: 'Gallery',              icon: Image },
  { to: '/admin/achievements',label: 'Achievements',         icon: Award },
  { to: '/admin/deadlines',   label: 'Deadlines',            icon: Clock },
  { to: '/admin/routines',    label: 'Routine',              icon: CalendarClock },
  { to: '/admin/contact',     label: 'Contacts',             icon: Mail },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // CRs get full CRUD on exactly these sections — nothing else in the panel
  const CR_SECTIONS = [
    '/admin/labs',
    '/admin/rooms',
    '/admin/announcements',
    '/admin/resources',
    '/admin/calendar',
    '/admin/gallery',
    '/admin/deadlines',
  ]

  // Deep-link guard: bounce CRs out of any admin page outside their sections
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/admin'
  if (user?.role === 'cr' && !CR_SECTIONS.includes(normalizedPath)) {
    return <Navigate to="/admin/announcements" replace />
  }

  const availableLinks = LINKS.filter(l => {
    if (user?.role === 'cr') {
      return CR_SECTIONS.includes(l.to);
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-canvas text-ink pt-[48px]">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 md:min-h-[calc(100vh-48px)] border-b md:border-b-0 md:border-r border-hairline flex-shrink-0 bg-canvas z-10 flex flex-col">
        <div className="p-6 border-b border-hairline">
          <div className="flex items-center gap-2 mb-3">
            <BackButton fallback="/" className="!-ml-2" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-deep-green"></span>
              <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate">
                {user?.role === 'cr' ? 'CR Control' : 'Admin Console'}
              </p>
            </div>
          </div>
          <p className="font-display font-bold text-[20px] tracking-tight text-ink truncate">{user?.name}</p>
          <p className="font-sans text-[13px] text-body-muted mt-0.5 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>

        <nav className="p-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible scrollbar-none">
          {availableLinks.map(l => {
            const Icon = l.icon
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-full text-[14px] font-sans font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-primary text-white font-semibold shadow-sm'
                      : 'text-body-muted hover:text-ink hover:bg-soft-stone'
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.8} className="opacity-70" />
                {l.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="hidden md:block p-6 mt-auto border-t border-hairline space-y-2">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-sans text-body-muted hover:text-ink hover:bg-soft-stone rounded-full transition-colors"
          >
            ← Public Site
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-sans text-body-muted hover:text-error hover:bg-red-50 rounded-full transition-colors text-left"
          >
            <Power size={14} /> Log out
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