import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getNotices } from '../../api/notices'
import { getStudents } from '../../api/students'
import { getResources } from '../../api/resources'
import { getEvents } from '../../api/events'
import { getDeadlines } from '../../api/deadlines'

export default function AdminDashboard() {
  const { data: nData } = useQuery({ queryKey: ['notices'],   queryFn: () => getNotices().then(r => r.data) })
  const { data: sData } = useQuery({ queryKey: ['students'],  queryFn: () => getStudents().then(r => r.data) })
  const { data: rData } = useQuery({ queryKey: ['resources'], queryFn: () => getResources().then(r => r.data) })
  const { data: eData } = useQuery({ queryKey: ['events'],    queryFn: () => getEvents().then(r => r.data) })
  const { data: dData } = useQuery({ queryKey: ['deadlines'], queryFn: () => getDeadlines().then(r => r.data) })

  const stats = [
    { label: 'Notices',   count: nData?.total ?? '—',              to: '/admin/notices',   color: 'text-primary' },
    { label: 'Students',  count: sData?.data?.length ?? '—',       to: '/admin/students',  color: 'text-green-500' },
    { label: 'Resources', count: rData?.data?.length ?? '—',       to: '/admin/resources', color: 'text-yellow-500' },
    { label: 'Events',    count: eData?.data?.length ?? '—',       to: '/admin/events',    color: 'text-orange-500' },
    { label: 'Deadlines', count: dData?.data?.length ?? '—',       to: '/admin/deadlines', color: 'text-red-500' },
  ]

  const recentNotices = nData?.data?.slice(0, 5) || []

  return (
    <div>
      <h1 className="font-display font-medium text-[36px] tracking-[-0.02em] text-ink mb-8">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
        {stats.map(s => (
          <Link
            key={s.label}
            to={s.to}
            className="border border-divider-soft bg-surface-pearl rounded-[20px] p-6 md:p-8 hover:border-ink/50 hover:shadow-sm transition-all flex flex-col justify-center items-center text-center"
          >
            <div className={`font-display font-medium text-[48px] leading-none mb-3 ${s.color}`}>
              {s.count}
            </div>
            <div className="font-sans text-[13px] font-bold uppercase tracking-[0.04em] text-[#696969]">
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent notices */}
      <h2 className="font-display font-medium text-[24px] tracking-[-0.02em] mb-6">Recent Notices</h2>
      <div className="border border-divider-soft bg-surface-pearl rounded-[20px] overflow-hidden shadow-sm">
        {recentNotices.length > 0
          ? recentNotices.map(n => (
              <div key={n._id} className="flex items-center gap-4 px-6 md:px-8 py-5 border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
                <span className="font-sans text-[12px] font-bold text-ink uppercase tracking-[0.04em] w-20 flex-shrink-0">{n.category}</span>
                <span className="text-[15px] font-[450] flex-1 truncate text-ink">{n.title}</span>
                {n.isPinned && <span className="font-sans text-[11px] font-bold text-canvas bg-ink uppercase tracking-[0.04em] px-2.5 py-1 rounded-full">Pinned</span>}
              </div>
            ))
          : <p className="text-ink-muted-80 text-[15px] font-[450] p-8">No notices yet.</p>}
      </div>

      <div className="mt-8 text-right">
        <Link to="/admin/notices" className="text-link text-[15px] font-[450]">
          Manage notices →
        </Link>
      </div>
    </div>
  )
}
