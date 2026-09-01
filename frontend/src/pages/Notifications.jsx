import { useState } from 'react'
import { CheckCheck, Trash2, Bell, UserPlus, UserCheck, MessageSquare, Reply, ThumbsUp, Heart, CheckCircle, XCircle, Send, Megaphone, Clock, FileText, Calendar, Image, Upload, Trophy, Zap } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import SEO from '../components/SEO'

const TYPE_ICONS = {
  follow: UserPlus,
  follow_back: UserCheck,
  forum_comment: MessageSquare,
  forum_reply: Reply,
  forum_upvote: ThumbsUp,
  project_like: Heart,
  project_approved: CheckCircle,
  project_rejected: XCircle,
  project_submitted: Send,
  announcement: Megaphone,
  deadline: Clock,
  assignment: FileText,
  calendar_event: Calendar,
  gallery_photo: Image,
  resource_uploaded: Upload,
  achievement: Trophy,
  attendance_session: Zap,
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
]

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    removeNotification,
  } = useNotifications()
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredNotifications = activeFilter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications

  return (
    <div className="min-h-screen bg-canvas text-ink pt-28 pb-24">
      <SEO title="Notifications | Electro Infinity" description="Your notifications" path="/notifications" />
      <div className="max-w-[720px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-[32px] md:text-[40px] font-normal tracking-tight text-ink">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="font-sans text-[14px] text-body-muted mt-1">
                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-soft-stone text-[13px] font-medium text-ink hover:bg-soft-stone/80 transition-colors"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-ink text-canvas'
                  : 'bg-soft-stone text-body-muted hover:text-ink'
              }`}
            >
              {filter.label}
              {filter.key === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 text-[11px]">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {loading && notifications.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl border border-hairline animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-soft-stone" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 bg-soft-stone rounded" />
                    <div className="h-3 w-1/2 bg-soft-stone rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-hairline border-dashed rounded-2xl bg-soft-stone/20">
              <div className="w-14 h-14 rounded-full bg-soft-stone flex items-center justify-center mb-4">
                <Bell size={24} className="text-body-muted" />
              </div>
              <p className="font-sans text-[16px] text-body-muted">
                {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="font-sans text-[13px] text-slate mt-1 max-w-xs">
                {activeFilter === 'unread'
                  ? 'All caught up! Check back later.'
                  : "You'll be notified about important activity across Electro Infinity"}
              </p>
            </div>
          ) : (
            <div className="border border-hairline rounded-2xl overflow-hidden divide-y divide-hairline">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                  onMarkRead={() => markRead(notification._id)}
                  onDelete={() => removeNotification(notification._id)}
                />
              ))}
            </div>
          )}
        </div>

        {hasMore && activeFilter === 'all' && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2.5 rounded-full border border-hairline text-[13px] font-medium text-body-muted hover:text-ink hover:border-slate transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationCard({ notification, onMarkRead, onDelete }) {
  const actor = notification.actor
  const IconComponent = TYPE_ICONS[notification.type] || Bell

  return (
    <div
      className={`flex gap-3 p-4 transition-colors hover:bg-soft-stone/30 ${
        !notification.isRead ? 'bg-pale-blue/20' : ''
      }`}
    >
      <div className="flex-shrink-0">
        {actor?.photo ? (
          <img src={actor.photo} alt="" className="w-10 h-10 rounded-full object-cover border border-hairline" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-soft-stone flex items-center justify-center">
            <IconComponent size={18} className="text-slate" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-[14px] leading-snug ${!notification.isRead ? 'font-semibold text-ink' : 'text-body-muted'}`}>
              {notification.title}
            </p>
            {notification.message && (
              <p className="text-[13px] text-slate mt-0.5 line-clamp-2">{notification.message}</p>
            )}
            <p className="text-[12px] text-slate mt-1">{notification.timeAgo || 'Just now'}</p>
          </div>
          {!notification.isRead && (
            <span className="w-2.5 h-2.5 rounded-full bg-action-blue flex-shrink-0 mt-1.5" />
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          {!notification.isRead && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkRead() }}
              className="text-[12px] font-medium text-action-blue hover:text-action-blue/80 transition-colors"
            >
              Mark as read
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex items-center gap-1 text-[12px] font-medium text-slate hover:text-error transition-colors"
          >
            <Trash2 size={11} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
