import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

export default function NotificationBell() {
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="button-icon-circular relative"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell size={18} strokeWidth={1.75} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-signature-coral text-white text-[10px] font-medium rounded-full px-1 ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
