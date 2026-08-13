import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getResources, getDownloadUrl } from '../api/resources'
import { getNotices } from '../api/notices'
import NoticeCard from '../components/NoticeCard'
import { useAuth } from '../context/AuthContext'
const TABS = [
  { id: 'notices',     label: 'Notices',         type: null },
  { id: 'notes',       label: 'Study Materials',  type: 'notes' },
  { id: 'pyq',         label: 'PYQs',             type: 'pyq' },
  { id: 'assignment',  label: 'Assignments',      type: 'assignment' },
  { id: 'lab_manual',  label: 'Lab Manuals',      type: 'lab_manual' },
  { id: 'syllabus',    label: 'Syllabus',         type: 'syllabus' },
]

export default function Resources() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const { user } = useAuth()

  const { data: noticesData, isLoading: nLoading } = useQuery({
    queryKey: ['notices', 'all'],
    queryFn: () => getNotices({ limit: 50 }).then(r => r.data),
    enabled: activeTab.id === 'notices',
  })

  const { data: resData, isLoading: rLoading } = useQuery({
    queryKey: ['resources', activeTab.type],
    queryFn: () => getResources({ type: activeTab.type }).then(r => r.data),
    enabled: activeTab.id !== 'notices',
  })

  const isLoading = activeTab.id === 'notices' ? nLoading : rLoading

  return (
    <div className="container pt-32 pb-20 min-h-screen bg-canvas text-ink">
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        For Students
      </h2>
      <h1 className="font-display font-semibold text-[clamp(40px,8vw,64px)] leading-tight tracking-normal mb-8 text-ink">
        Resources
      </h1>

      {/* Tabs — horizontal scroll on mobile */}
      <div className="flex gap-2 sm:gap-6 border-b border-divider-soft overflow-x-auto scrollbar-none mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab)}
            className={`font-sans text-[14px] font-semibold uppercase tracking-widest pb-3 flex-none whitespace-nowrap border-b-2 transition-colors ${
              activeTab.id === tab.id
                ? 'text-primary border-primary'
                : 'text-ink-muted-48 border-transparent hover:text-ink-muted-80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-300">
        {isLoading ? (
          <Skeleton />
        ) : activeTab.id === 'notices' ? (
          <div className="grid gap-6 md:grid-cols-2">
            {noticesData?.data?.length > 0
              ? noticesData.data.map(n => <NoticeCard key={n._id} notice={n} />)
              : <Empty label="notices" user={user} />}
          </div>
        ) : (
          <div className="flex flex-col border-t border-divider-soft">
            {resData?.data?.length > 0
              ? resData.data.map(r => <ResourceRow key={r._id} resource={r} />)
              : <Empty label={activeTab.label.toLowerCase()} user={user} />}
          </div>
        )}
      </div>
    </div>
  )
}

function ResourceRow({ resource: r }) {
  const date = new Date(r.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="flex items-start sm:items-center gap-6 py-6 border-b border-divider-soft group">
      {/* Semester badge */}
      {r.semester && (
        <span className="font-sans text-[12px] font-semibold text-primary w-14 flex-shrink-0 pt-0.5 sm:pt-0 uppercase tracking-widest">
          Sem {r.semester}
        </span>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[17px] font-semibold text-ink leading-snug">{r.title}</p>
        {r.subject && (
          <p className="font-sans text-[12px] font-medium text-ink-muted-48 mt-1 uppercase tracking-widest">{r.subject}</p>
        )}
        <p className="font-sans text-[12px] font-medium text-ink-muted-80 mt-1">{date} · {r.downloadCount} downloads</p>
      </div>

      {/* Download */}
      <a
        href={getDownloadUrl(r._id)}
        target="_blank"
        rel="noreferrer"
        className="font-sans text-[12px] font-semibold uppercase tracking-widest text-link flex-shrink-0 hover:text-primary transition-colors"
      >
        Download ↓
      </a>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col border-t border-divider-soft">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 py-6 border-b border-divider-soft animate-pulse">
          <div className="w-14 h-4 bg-surface-pearl rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-surface-pearl rounded w-64" />
            <div className="h-4 bg-surface-pearl rounded w-32" />
          </div>
          <div className="w-20 h-4 bg-surface-pearl rounded" />
        </div>
      ))}
    </div>
  )
}

function Empty({ label, user }) {
  return (
    <div className="py-16 text-center border-b border-divider-soft">
      <p className="font-sans text-[17px] text-ink-muted-80">
        No {label} uploaded yet.{user ? ' Ask your CR (Class Representative) to add some.' : ''}
      </p>
    </div>
  )
}
