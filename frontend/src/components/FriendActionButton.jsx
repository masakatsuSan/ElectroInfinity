import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  UserCheck,
  Heart,
  X,
  Check,
} from 'lucide-react'
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from '../api/profile'
import { useAuth } from '../context/AuthContext'
import { EASE, DURATION } from '../utils/motion'

export default function FriendActionButton({
  userId,
  friendStatus = 'none',
  onUpdate,
  size = 'md',
  showIcon = true,
}) {
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState(friendStatus)
  const [burst, setBurst] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const btnRef = useRef(null)

  if (!currentUser?._id || userId === currentUser._id) return null

  const handleSend = async () => {
    setLoading(true)
    try {
      await sendFriendRequest(userId)
      setLocalStatus('pending_sent')
      onUpdate?.({ friendStatus: 'pending_sent' })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setLoading(true)
    try {
      const res = await acceptFriendRequest(userId)
      setLocalStatus('friends')
      setBurst(true)
      setTimeout(() => setBurst(false), 800)
      onUpdate?.({
        friendStatus: 'friends',
        friends: res.data.data.friendsCount,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await rejectFriendRequest(userId)
      setLocalStatus('none')
      onUpdate?.({ friendStatus: 'none' })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    try {
      await removeFriend(userId)
      setLocalStatus('none')
      onUpdate?.({ friendStatus: 'none' })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setConfirmRemove(false)
    }
  }

  const handleRemove = async () => {
    setLoading(true)
    try {
      await removeFriend(userId)
      setLocalStatus('none')
      onUpdate?.({ friendStatus: 'none' })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setConfirmRemove(false)
    }
  }

  const sizeClasses = {
    sm: 'px-4 py-1.5 text-[12px]',
    md: 'px-5 py-2 text-[14px] font-medium',
    lg: 'px-6 py-2.5 text-[14px]',
  }

  const iconSize = showIcon ? (size === 'sm' ? 12 : size === 'lg' ? 16 : 14) : 0

  const baseBtnClass = `inline-flex items-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 ${sizeClasses[size]}`

  if (localStatus === 'friends') {
    return (
      <div className="relative inline-flex">
        <button
          ref={btnRef}
          onClick={() => setConfirmRemove(true)}
          disabled={loading}
          className={`${baseBtnClass} bg-gray-100 text-gray-700 border border-hairline hover:bg-gray-200`}
        >
          {showIcon && <UserCheck size={iconSize} />}
          Friends
        </button>
        <AnimatePresence>
          {burst && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.slow, ease: EASE.out }}
            >
              <Heart size={iconSize * 2} className="text-[#E44523] fill-[#E44523]" />
            </motion.div>
          )}
        </AnimatePresence>
        {confirmRemove && (
          <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-hairline rounded-lg shadow-lg p-2 flex items-center gap-2 min-w-max">
            <button
              onClick={handleRemove}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <X size={12} /> Remove
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }

  if (localStatus === 'pending_sent') {
    return (
      <div className="relative inline-flex">
        <button
          ref={btnRef}
          onClick={handleCancel}
          disabled={loading}
          className={`${baseBtnClass} bg-gray-100 text-gray-700 border border-hairline hover:bg-gray-200`}
        >
          {showIcon && <UserCheck size={iconSize} />}
          Requested
        </button>
      </div>
    )
  }

  if (localStatus === 'pending_received') {
    return (
      <div className="inline-flex items-center gap-2">
        <button
          ref={btnRef}
          onClick={handleAccept}
          disabled={loading}
          className={`${baseBtnClass} bg-ink text-white hover:bg-primary-active`}
        >
          {showIcon && <Check size={iconSize} />}
          Accept
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className={`${baseBtnClass} bg-gray-100 text-gray-700 border border-hairline hover:bg-gray-200`}
        >
          {showIcon && <X size={iconSize} />}
          Decline
        </button>
      </div>
    )
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        onClick={handleSend}
        disabled={loading}
        className={`${baseBtnClass} bg-ink text-white hover:bg-primary-active`}
      >
        {showIcon && <UserPlus size={iconSize} />}
        Add Friend
      </button>
      <AnimatePresence>
        {burst && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.slow, ease: EASE.out }}
          >
            <Heart size={iconSize * 2} className="text-[#E44523] fill-[#E44523]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
