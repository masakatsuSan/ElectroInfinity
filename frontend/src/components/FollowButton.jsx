import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, UserCheck, UserRound, Heart } from 'lucide-react'
import { toggleFollow } from '../api/profile'
import { useAuth } from '../context/AuthContext'

export default function FollowButton({ userId, isFollowing, followsMe, onUpdate, size = 'md', showIcon = true }) {
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [following, setFollowing] = useState(isFollowing || false)
  const [burst, setBurst] = useState(false)
  const btnRef = useRef(null)

  if (!currentUser?._id || userId === currentUser._id) return null

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await toggleFollow(userId)
      const { isFollowing: newFollowing, followers, following } = res.data.data
      setFollowing(newFollowing)
      if (newFollowing && !following) {
        setBurst(true)
        setTimeout(() => setBurst(false), 800)
      }
      onUpdate?.({ isFollowing: newFollowing, followers, following })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-5 py-2 text-[13px]',
    lg: 'px-6 py-3 text-[14px]',
  }

  const iconSize = showIcon ? (size === 'sm' ? 12 : size === 'lg' ? 16 : 14) : 0

  if (following) {
    return (
      <div className="relative inline-flex">
        <button
          ref={btnRef}
          onClick={handleClick}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${sizeClasses[size]} bg-soft-stone text-ink border border-hairline hover:bg-soft-stone/80`}
        >
          {showIcon && <UserCheck size={iconSize} />}
          Following
        </button>
        <AnimatePresence>
          {burst && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Heart size={iconSize * 2} className="text-coral fill-coral" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (followsMe) {
    return (
      <div className="relative inline-flex">
        <button
          ref={btnRef}
          onClick={handleClick}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${sizeClasses[size]} bg-ink text-canvas hover:bg-ink/90`}
        >
          {showIcon && <UserRound size={iconSize} />}
          Follow Back
        </button>
        <AnimatePresence>
          {burst && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Heart size={iconSize * 2} className="text-coral fill-coral" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${sizeClasses[size]} bg-ink text-canvas hover:bg-ink/90`}
      >
        {showIcon && <UserPlus size={iconSize} />}
        Follow
      </button>
      <AnimatePresence>
        {burst && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Heart size={iconSize * 2} className="text-coral fill-coral" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
