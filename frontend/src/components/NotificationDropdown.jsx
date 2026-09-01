import { useNavigate } from 'react-router-dom'
import { CheckCheck, Trash2 } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const TYPE_ICONS = {
  follow: '👋',
  follow_back: '🤝',
  forum_comment: '💬',
  forum_reply: '↩️',
  forum_upvote: '⬆️',
  project_like: '❤️',
  project_approved: '✅',
  project_rejected: '❌',
  project_submitted: '🚀',
  announcement: '📢',
  deadline: '⏰',
  assignment: '📝',
  calendar_event: '📅',
  gallery_photo: '📷',
  resource_uploaded: '📤',
  achievement: '🏆',
  attendance_session: '⚡',
}

export default function NotificationDropdown({ onClose }) {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead, removeNotification, loading } = useNotifications()

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification._id)
    }
    if (notification.link) {
      navigate(notification.link)
    }
    onClose()
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await removeNotification(id)
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-canvas border border-hairline rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-soft-stone/30">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-[15px] text-ink">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-coral/10 text-coral text-[11px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[12px] font-medium text-action-blue hover:text-action-blue/80 transition-colors"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[380px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-soft-stone" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-soft-stone rounded" />
                  <div className="h-2.5 w-1/2 bg-soft-stone rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-soft-stone flex items-center justify-center mb-3">
              <span className="text-[20px]">🔔</span>
            </div>
            <p className="font-sans text-[14px] text-body-muted">No notifications yet</p>
            <p className="font-sans text-[12px] text-slate mt-1">
              You'll be notified about important activity here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onDelete={(e) => handleDelete(e, notification._id)}
              />
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-hairline bg-soft-stone/20">
          <button
            onClick={() => {
              navigate('/notifications')
              onClose()
            }}
            className="w-full text-center text-[13px] font-medium text-action-blue hover:text-action-blue/80 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification, onClick, onDelete }) {
  const actor = notification.actor
  const icon = TYPE_ICONS[notification.type] || '🔔'

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-soft-stone/40 ${
        !notification.isRead ? 'bg-pale-blue/30' : ''
      }`}
    >
      <div className="flex-shrink-0">
        {actor?.photo ? (
          <img
            src={actor.photo}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-hairline"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-soft-stone flex items-center justify-center text-[16px]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug ${!notification.isRead ? 'font-semibold text-ink' : 'text-body-muted'}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-[12px] text-slate mt-0.5 line-clamp-1">{notification.message}</p>
        )}
        <p className="text-[11px] text-slate mt-1">{notification.timeAgo || 'Just now'}</p>
      </div>

      <div className="flex items-start gap-1 flex-shrink-0">
        {!notification.isRead && (
          <span className="w-2 h-2 rounded-full bg-action-blue mt-1.5" />
        )}
        <button
          onClick={onDelete}
          className="p-1 text-slate hover:text-error transition-colors rounded"
          aria-label="Delete notification"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
