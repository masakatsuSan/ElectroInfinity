import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, UserCheck, UserRound, ExternalLink } from 'lucide-react'
import FollowButton from './FollowButton'

export default function UserPopover({ user, rect, onClose, onFollow, onViewProfile }) {
  const popoverRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!rect || !popoverRef.current) return

    const popover = popoverRef.current
    const popoverRect = popover.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = rect.bottom + 8
    let left = rect.left

    if (left + popoverRect.width > viewportWidth - 16) {
      left = viewportWidth - popoverRect.width - 16
    }
    if (left < 16) {
      left = 16
    }
    if (top + popoverRect.height > viewportHeight - 16) {
      top = rect.top - popoverRect.height - 8
    }
    if (top < 16) {
      top = 16
    }

    setPosition({ top, left })
  }, [rect])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!user) return null

  const displayUsername = user.rollNumber
    ? `@${user.rollNumber.toLowerCase()}`
    : user.name
      ? `@${user.name.toLowerCase().replace(/\s+/g, '')}`
      : ''

  return (
    <AnimatePresence>
      {rect && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 9999 }}
          className="w-80 bg-canvas border border-hairline rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
        >
          {/* Header with avatar and close button */}
          <div className="relative p-5 pb-4">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-soft-stone transition-colors text-body-muted hover:text-ink"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-soft-stone flex-shrink-0">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-ink/5">
                    <span className="text-xl font-display font-bold text-ink-muted-48">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-[15px] text-ink truncate">{user.name}</h3>
                {displayUsername && (
                  <p className="font-mono text-[12px] text-body-muted truncate">{displayUsername}</p>
                )}
              </div>
            </div>

            {user.bio && (
              <p className="text-[13px] text-body-muted leading-relaxed line-clamp-2 mb-3">
                {user.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="font-display font-bold text-[15px] text-ink">{user.postCount || 0}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-body-muted">Posts</p>
              </div>
              <div className="w-px h-6 bg-hairline" />
              <div className="text-center">
                <p className="font-display font-bold text-[15px] text-ink">{user.followers?.length || 0}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-body-muted">Followers</p>
              </div>
              <div className="w-px h-6 bg-hairline" />
              <div className="text-center">
                <p className="font-display font-bold text-[15px] text-ink">{user.following?.length || 0}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-body-muted">Following</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <FollowButton
                userId={user._id}
                isFollowing={user.isFollowing}
                followsMe={user.followsMe}
                onUpdate={onFollow}
                size="sm"
              />
              <button
                onClick={() => onViewProfile?.(user._id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-full border border-hairline text-ink hover:bg-soft-stone transition-colors"
              >
                <ExternalLink size={12} />
                View Profile
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
