import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getAnnouncements, getAnnouncement } from '../api/announcements'
import { Bell, Pin, Paperclip, User } from 'lucide-react'
import SEO from '../components/SEO'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'academic', label: 'Academic' },
  { key: 'class', label: 'Class' },
  { key: 'exam', label: 'Exam' },
  { key: 'urgent', label: 'Urgent' },
]

const CATEGORY_COLORS = {
  urgent:    { bg: 'bg-coral/10',     text: 'text-coral',         border: 'border-coral/30',        dot: 'bg-coral' },
  exam:      { bg: 'bg-action-blue/10', text: 'text-action-blue', border: 'border-action-blue/30', dot: 'bg-action-blue' },
  class:     { bg: 'bg-form-focus/10', text: 'text-form-focus',  border: 'border-form-focus/30',   dot: 'bg-form-focus' },
  academic:  { bg: 'bg-orange-50',   text: 'text-orange-600',    border: 'border-orange-200',      dot: 'bg-orange-400' },
  general:   { bg: 'bg-soft-stone',  text: 'text-slate',          border: 'border-hairline',        dot: 'bg-slate' },
}

const categoryLabel = (key) =>
  CATEGORIES.find((c) => c.key === key)?.label || 'General'

const categoryColor = (key) =>
  CATEGORY_COLORS[key] || CATEGORY_COLORS.general

function truncate(str, n = 240) {
  if (!str) return ''
  const s = String(str).trim()
  if (s.length <= n) return s
  return s.slice(0, n).trimEnd() + '\u2026'
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-hairline rounded-xl p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-24 bg-soft-stone rounded" />
            <div className="h-3 w-12 bg-soft-stone rounded" />
          </div>
          <div className="h-4 w-full bg-soft-stone rounded mb-2" />
          <div className="h-3 w-full bg-soft-stone rounded mb-1.5" />
          <div className="h-3 w-5/6 bg-soft-stone rounded" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-hairline border-dashed rounded-xl bg-soft-stone/20">
      <div className="w-12 h-12 rounded-full bg-soft-stone flex items-center justify-center mb-4">
        <Bell size={22} className="text-body-muted" />
      </div>
      <p className="font-sans text-[15px] text-body-muted">{message}</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="text-center py-16 border border-hairline border-dashed rounded-xl bg-soft-stone/20">
      <Bell size={24} className="mx-auto text-coral mb-3" />
      <p className="font-sans text-[15px] text-body-muted">
        Couldn't load announcements right now.
      </p>
    </div>
  )
}

function AnnouncementCard({ ann, onClick }) {
  const color = categoryColor(ann.category)
  const isPinned = !!ann.isPinned
  const preview = truncate(ann.content, 240)

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`group cursor-pointer bg-white border border-hairline rounded-xl p-5 transition-all duration-200 hover:border-slate/40 hover:shadow-card focus:outline-none focus:ring-1 focus:ring-primary ${
        isPinned ? 'border-l-4 border-l-coral' : ''
      }`}
    >
      {/* Header: category badge + pinned indicator */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isPinned && <Pin size={14} className="text-coral" />}
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${color.bg} ${color.text} ${color.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
            {categoryLabel(ann.category)}
          </span>
          {isPinned && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-coral">
              Pinned
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display font-bold text-[17px] text-ink leading-snug mb-1 line-clamp-2">
        {ann.title || 'Untitled Announcement'}
      </h3>

      {/* Content preview (truncated) */}
      {preview && (
        <p className="font-sans text-[14px] text-body-muted leading-relaxed mb-3 line-clamp-3 break-words">
          {preview}
        </p>
      )}

      {/* Meta + attachment */}
      <div className="flex items-center justify-between gap-3 text-[13px] text-body-muted">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <User size={12} />
            {ann.postedBy?.name || 'Department Office'}
          </span>
          <span className="text-slate">·</span>
          <span className="font-mono">{formatDate(ann.createdAt)}</span>
        </div>
        {ann.attachmentUrl && (
          <a
            href={ann.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-action-blue hover:underline"
            aria-label="View attachment"
          >
            <Paperclip size={12} />
          </a>
        )}
      </div>
    </div>
  )
}

function AnnouncementDetail({ detail, loading, error, user, onClose }) {
  const color = categoryColor(detail?.category)
  const isPinned = !!detail?.isPinned
  const isRead = !!(
    user && detail?.readBy?.some(
      (uid) => String(uid) === String(user._id)
    )
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-white border border-hairline rounded-2xl shadow-modal flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="font-sans text-[14px] text-error">
              Could not load this announcement.
            </p>
          </div>
        ) : detail ? (
          <>
            <div className="px-6 pt-5 pb-4 border-b border-hairline">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {isPinned && <Pin size={14} className="text-coral" />}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${color.bg} ${color.text} ${color.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                    {categoryLabel(detail.category)}
                  </span>
                  {isPinned && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-coral">
                      Pinned
                    </span>
                  )}
                </div>
                {user && (
                  <span
                    className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isRead
                        ? 'text-deep-green bg-pale-green'
                        : 'text-coral bg-coral/10'
                    }`}
                  >
                    {isRead ? 'Read' : 'New'}
                  </span>
                )}
              </div>
              <h2 className="font-display text-[22px] font-bold text-ink mt-3 leading-snug break-words">
                {detail.title || 'Untitled Announcement'}
              </h2>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center gap-4 text-[13px] text-body-muted">
                <span className="inline-flex items-center gap-1">
                  <User size={13} />
                  {detail.postedBy?.name || 'Department Office'}
                </span>
                <span className="text-slate">·</span>
                <span className="font-mono">{formatDate(detail.createdAt)}</span>
              </div>

              <p className="font-sans text-[15px] text-ink leading-relaxed whitespace-pre-wrap break-words">
                {detail.content || 'No content provided.'}
              </p>

              {detail.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={detail.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium text-action-blue hover:underline"
                  >
                    <Paperclip size={14} />
                    View Attachment
                  </a>
                </div>
              )}

              {user && (
                <p className="font-mono text-[11px] uppercase tracking-wider text-body-muted">
                  {isRead
                    ? 'Marked as read for your account.'
                    : 'Marking as read…'}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-hairline">
              <button
                onClick={onClose}
                className="button-secondary !px-4 !py-1.5 !text-[13px]"
              >
                Close
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default function Announcements() {
  const { user } = useAuth()
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  // List of all announcements (public; optional auth so the API can personalize)
  const { data, isLoading, error } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => getAnnouncements({ limit: 50 }).then((r) => r.data),
    staleTime: 60_000,
  })

  const items = data?.data || []

  // Client-side filter + pin-first ordering
  const visible = useMemo(() => {
    const list =
      activeCategory === 'all'
        ? items
        : items.filter((a) => a.category === activeCategory)

    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [items, activeCategory])

  // Detail view. Opening it calls GET /announcements/:id, which the API
  // automatically uses to mark the announcement as read for logged-in users.
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ['announcement', selectedId],
    queryFn: () => getAnnouncement(selectedId).then((r) => r.data.data),
    enabled: !!selectedId,
    staleTime: 60_000,
  })

  return (
    <div className="min-h-screen bg-canvas text-ink pt-32 pb-24">
      <SEO
        title="Announcements | Official Communications"
        description="Official communications from the department and club"
        path="/announcements"
      />

      <div className="max-w-[1100px] mx-auto px-4 md:px-6">
        {/* Header */}
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider text-coral mb-3">
            <Bell size={16} strokeWidth={1.75} /> Official Communications
          </span>
          <h1 className="font-display text-[38px] md:text-[46px] font-normal tracking-tight text-ink">
            Announcements
          </h1>
          <p className="mt-3 font-sans text-[16px] text-body-muted leading-relaxed max-w-2xl">
            Official communications from the department and club
          </p>
        </header>

        {/* Category filter */}
        <nav
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-1"
          aria-label="Filter announcements"
        >
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.key
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCategory(c.key)}
                className={`font-mono text-[12px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate hover:text-ink bg-soft-stone/60 hover:bg-soft-stone'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </nav>

        {/* List / states */}
        {isLoading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorState />
        ) : visible.length === 0 ? (
          <EmptyState
            message={
              activeCategory === 'all'
                ? 'No announcements have been posted yet.'
                : `No ${categoryLabel(activeCategory).toLowerCase()} announcements found.`
            }
          />
        ) : (
          <div className="space-y-4">
            {visible.map((a) => (
              <AnnouncementCard
                key={a._id}
                ann={a}
                onClick={() => setSelectedId(a._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedId && (
        <AnnouncementDetail
          detail={detail}
          loading={detailLoading}
          error={detailError}
          user={user}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
