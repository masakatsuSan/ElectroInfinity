import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAnnouncements } from '../../api/announcements'
import { getStudents } from '../../api/students'
import { getResources } from '../../api/resources'
import { getDeadlines } from '../../api/deadlines'
import { getAdminFaculty } from '../../api/attendance'
import { Hash, Code2, Megaphone, MessageCircle } from 'lucide-react'
import api from '../../api/axios'

export default function AdminDashboard() {
  const { data: aData } = useQuery({ queryKey: ['announcements'], queryFn: () => getAnnouncements({ limit: 100 }).then(r => r.data) })
  const { data: sData } = useQuery({ queryKey: ['students'],  queryFn: () => getStudents().then(r => r.data) })
  const { data: rData } = useQuery({ queryKey: ['resources'], queryFn: () => getResources().then(r => r.data) })
  const { data: dData } = useQuery({ queryKey: ['deadlines'], queryFn: () => getDeadlines().then(r => r.data) })
  const { data: fData } = useQuery({ queryKey: ['admin-faculty'], queryFn: () => getAdminFaculty().then(r => r.data) })
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const stats = [
    { label: 'Faculty',       count: fData?.data?.length ?? '—', to: '/admin/attendance',    badge: 'Active System' },
    { label: 'Students',      count: sData?.data?.length ?? '—', to: '/admin/students',      badge: 'Roster' },
    { label: 'Announcements', count: aData?.total ?? '—',        to: '/admin/announcements', badge: 'Official' },
    { label: 'Deadlines',     count: dData?.data?.length ?? '—', to: '/admin/deadlines',     badge: 'Tasks' },
    { label: 'Resources',     count: rData?.data?.length ?? '—', to: '/admin/resources',     badge: 'Files' },
  ]

  const communityStats = [
    { label: 'Rooms',         count: adminStats?.data?.totalRooms ?? '—',          to: '/admin/rooms',        badge: 'Community',   icon: Hash },
    { label: 'Posts',         count: adminStats?.data?.totalPosts ?? '—',          to: '/admin/rooms',        badge: 'Discussions', icon: MessageCircle },
    { label: 'Projects',      count: adminStats?.data?.totalProjects ?? '—',       to: '/admin/projects',     badge: 'Showcase',    icon: Code2 },
    { label: 'Announcements', count: adminStats?.data?.totalAnnouncements ?? '—',  to: '/admin/announcements', badge: 'Official', icon: Megaphone },
  ]

  const recentAnnouncements = (aData?.data || []).slice(0, 5)

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-deep-green"></span>
          <span className="font-mono text-[12px] uppercase tracking-wider text-slate font-semibold">
            Enterprise Command Center
          </span>
        </div>
        <h1 className="font-display font-bold text-[36px] tracking-tight text-ink">
          Department Overview
        </h1>
        <p className="font-sans text-[15px] text-body-muted mt-1">
          Monitor batch attendance sessions, students, faculty assignments, and department assets.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <Link key={s.label} to={s.to} className="group border border-hairline bg-canvas rounded-2xl p-6 hover:border-action-blue/40 hover:shadow-card transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate font-medium">
                {s.badge}
              </span>
            </div>
            <div className="font-display font-bold text-[28px] leading-none text-ink group-hover:text-action-blue transition-colors">
              {s.count}
            </div>
            <div className="font-sans text-[13px] font-semibold text-body-muted mt-3 pt-2 border-t border-hairline">
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Community stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {communityStats.map(s => {
          const Icon = s.icon
          return (
            <Link key={s.label} to={s.to} className="group border border-hairline bg-canvas rounded-2xl p-6 hover:border-action-blue/40 hover:shadow-card transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-body-muted" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate font-medium">
                  {s.badge}
                </span>
              </div>
              <div className="font-display font-bold text-[28px] leading-none text-ink group-hover:text-action-blue transition-colors">
                {s.count}
              </div>
              <div className="font-sans text-[13px] font-semibold text-body-muted mt-3 pt-2 border-t border-hairline">
                {s.label}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Action Band */}
      <div className="border border-hairline bg-soft-stone rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-bold block mb-1">
            Attendance & Role Management
          </span>
          <h2 className="font-display text-[22px] font-bold text-ink">Faculty & Live Attendance Console</h2>
          <p className="font-sans text-[14px] text-body-muted mt-0.5">
            Configure faculty accounts, assign subjects per batch, and inspect live GPS classroom sessions.
          </p>
        </div>
        <Link to="/admin/attendance" className="button-primary whitespace-nowrap !py-2.5 !px-5">
          Manage Attendance →
        </Link>
      </div>

      {/* Latest announcements (Research-table style) */}
      <div className="border border-hairline bg-canvas rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <h3 className="font-display text-[20px] font-bold text-ink">Latest Announcements</h3>
          <Link to="/admin/announcements" className="button-pill-outline text-[13px]">
            View All →
          </Link>
        </div>

        {recentAnnouncements.length > 0 ? (
          <div className="divide-y divide-hairline">
            {recentAnnouncements.map(a => (
              <div key={a._id} className="py-4 flex items-center justify-between gap-4 hover:bg-soft-stone/30 transition-colors px-2 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-pale-green text-deep-green border border-green-200 flex-shrink-0">
                    {a.category || 'General'}
                  </span>
                  <span className="font-sans text-[14px] font-medium text-ink truncate">{a.title}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {a.targetAudience === 'batch' && a.batchId && (
                    <span className="font-mono text-[10px] font-bold uppercase bg-ink text-white px-2 py-0.5 rounded-full">
                      {a.batchId}
                    </span>
                  )}
                  {a.isPinned && (
                    <span className="font-mono text-[10px] font-bold uppercase bg-ink text-white px-2 py-0.5 rounded-full">
                      Pinned
                    </span>
                  )}
                  <span className="font-sans text-[12px] text-slate">
                    {new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-muted text-[14px] py-8 text-center">No announcements published yet.</p>
        )}
      </div>
    </div>
  )
}