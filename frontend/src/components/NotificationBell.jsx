import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import NotificationDropdown from './NotificationDropdown'

export default function NotificationBell() {
  const { unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const bellRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.overflow = 'hidden'
      document.body.style.width = '100%'
    } else {
      const scrollY = parseInt(document.body.style.top || '0', 10)
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.overflow = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
    return () => {
      const scrollY = parseInt(document.body.style.top || '0', 10)
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.overflow = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-body-muted hover:text-ink transition-colors p-1.5 rounded-full hover:bg-soft-stone"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-coral text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-canvas">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  )
}
