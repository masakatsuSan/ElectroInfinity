import { useState } from 'react'
import { UserPlus, UserCheck, UserRound } from 'lucide-react'
import { toggleFollow } from '../api/profile'
import { useAuth } from '../context/AuthContext'

export default function FollowButton({ userId, isFollowing, followsMe, onUpdate, size = 'md', showIcon = true }) {
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [following, setFollowing] = useState(isFollowing || false)
  const [followsMeState, setFollowsMeState] = useState(followsMe || false)

  if (!currentUser?._id || userId === currentUser._id) return null

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await toggleFollow(userId)
      const { isFollowing: newFollowing, followers, following } = res.data.data
      setFollowing(newFollowing)
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
      <button
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${sizeClasses[size]} bg-soft-stone text-ink border border-hairline hover:bg-soft-stone/80`}
      >
        {showIcon && <UserCheck size={iconSize} />}
        Following
      </button>
    )
  }

  if (followsMeState) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${sizeClasses[size]} bg-ink text-canvas hover:bg-ink/90`}
      >
        {showIcon && <UserRound size={iconSize} />}
        Follow Back
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${sizeClasses[size]} bg-ink text-canvas hover:bg-ink/90`}
    >
      {showIcon && <UserPlus size={iconSize} />}
      Follow
    </button>
  )
}
