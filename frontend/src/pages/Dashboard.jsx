import { useQuery } from '@tanstack/react-query'
import { Bell, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function SkeletonCard() {
  return (
    <div className="bg-white border border-hairline rounded-xl p-5 animate-pulse">
      <div className="h-3 w-20 bg-soft-stone rounded mb-3" />
      <div className="h-5 w-full bg-soft-stone rounded mb-2" />
      <div className="h-3 w-32 bg-soft-stone rounded" />
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="bg-white border border-hairline rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-soft-stone rounded-lg" />
        <div className="h-3 w-24 bg-soft-stone rounded" />
      </div>
      <div className="h-8 w-12 bg-soft-stone rounded" />
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-hairline border-t-ink rounded-full animate-spin" />
    </div>
  )
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 bg-soft-stone/30 rounded-xl border border-hairline border-dashed">
      <div className="w-12 h-12 bg-soft-stone rounded-full flex items-center justify-center mb-3">
        <Icon size={22} className="text-body-muted" />
      </div>
      <p className="text-body-muted text-[14px] text-center">{message}</p>
    </div>
  )
}

function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const { user } = useAuth()

  const announcementsQuery = useQuery({
    queryKey: ['dashboard-announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements', { params: { limit: 5 } })
      return res.data.data || []
    },
  })

  const postsQuery = useQuery({
    queryKey: ['dashboard-posts'],
    queryFn: async () => {
      const res = await api.get('/forum', { params: { limit: 5, sort: 'latest' } })
      return res.data.data || []
    },
  })

  if (announcementsQuery.isLoading || postsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink pt-28 pb-24">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-40 bg-soft-stone rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-soft-stone rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <StatSkeleton />
            <StatSkeleton />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const recentAnnouncements = announcementsQuery.data || []
  const recentPosts = postsQuery.data || []

  return (
    <div className="min-h-screen bg-canvas text-ink pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-[28px] md:text-[32px] font-bold tracking-tight text-ink mb-1">
            Dashboard
          </h1>
          <p className="text-body-muted text-[15px]">
            Welcome back, <span className="text-ink font-medium">{user?.name || 'User'}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <StatCard
            icon={Bell}
            label="Announcements"
            count={recentAnnouncements.length}
            accent="text-coral bg-coral-soft/20"
          />
          <StatCard
            icon={MessageCircle}
            label="Discussions"
            count={recentPosts.length}
            accent="text-action-blue bg-pale-blue"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section
            title="Recent Announcements"
            icon={Bell}
            items={recentAnnouncements}
            emptyMessage="No announcements yet."
            renderItem={(a) => (
              <div key={a._id} className="bg-white border border-hairline rounded-xl p-4 hover:border-slate/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[15px] font-bold text-ink leading-snug line-clamp-1">{a.title}</h3>
                  {a.category && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-body-muted bg-soft-stone px-2 py-0.5 rounded-md flex-shrink-0">
                      {a.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-body-muted">
                  <span className="font-mono">{formatDate(a.createdAt || a.date)}</span>
                </div>
              </div>
            )}
          />

          <Section
            title="Recent Discussions"
            icon={MessageCircle}
            items={recentPosts}
            emptyMessage="No discussions yet. Start the conversation!"
            renderItem={(p) => (
              <div key={p._id} className="bg-white border border-hairline rounded-xl p-4 hover:border-slate/30 transition-colors">
                <h3 className="text-[15px] font-bold text-ink leading-snug line-clamp-1 mb-2">{p.title}</h3>
                <div className="flex items-center gap-3 text-[13px] text-body-muted">
                  <span className="truncate">
                    {p.author?.name || 'Unknown'}
                    {p.room?.name && (
                      <>
                        <span className="text-slate mx-1">·</span>
                        <span className="text-slate">{p.room.name}</span>
                      </>
                    )}
                  </span>
                  <span className="flex items-center gap-1 ml-auto flex-shrink-0">
                    <span className="text-[12px] font-bold text-ink">{(p.upvotes?.length || 0)}</span>
                    <span className="text-[12px] text-body-muted">upvotes</span>
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, count, accent }) {
  return (
    <div className="bg-white border border-hairline rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon size={20} strokeWidth={1.75} />
        </div>
        <span className="text-[13px] font-medium text-body-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[32px] font-display font-bold text-ink leading-none">{count}</p>
    </div>
  )
}

function Section({ title, icon: Icon, items, emptyMessage, renderItem }) {
  return (
    <div className="bg-white border border-hairline rounded-xl">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <Icon size={16} strokeWidth={1.75} className="text-body-muted" />
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-body-muted">{title}</h2>
      </div>
      <div className="px-4 pb-4">
        {items.length === 0 ? (
          <EmptyState icon={Icon} message={emptyMessage} />
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map(renderItem)}
          </div>
        )}
      </div>
    </div>
  )
}