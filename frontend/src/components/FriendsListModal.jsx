import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X, User, Users as UsersIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getFriendList } from '../api/profile'
import {
  MODAL_VARIANTS,
  MODAL_TRANSITION,
  OVERLAY_VARIANTS,
  OVERLAY_TRANSITION,
} from '../utils/motion'

function FriendAvatar({ friend }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
      {friend.photo ? (
        <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-sans font-medium text-[14px] text-gray-500">
          {friend.name?.charAt(0)}
        </span>
      )}
    </div>
  )
}

export default function FriendsListModal({ open, onClose, userId }) {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')

  const { data: friendData, isLoading, error } = useQuery({
    queryKey: ['friendList', userId],
    queryFn: () => getFriendList(userId).then((r) => r.data.data),
    enabled: !!open && !!userId,
  })

  const { data: currentFriendData } = useQuery({
    queryKey: ['friendList', currentUser?._id],
    queryFn: () => getFriendList(currentUser._id).then((r) => r.data.data),
    enabled: !!open && !!currentUser?._id && currentUser._id !== userId && !currentUser?.friends?.length,
  })

  const friends = friendData || []
  const currentFriendIds = useMemo(() => {
    const ids = new Set((currentUser?.friends || []).map((id) => id.toString()))
    ;(currentFriendData || []).forEach((friend) => ids.add(friend._id.toString()))
    return ids
  }, [currentUser?.friends, currentFriendData])

  const mutuals = useMemo(
    () => friends.filter((friend) => currentFriendIds.has(friend._id.toString())),
    [friends, currentFriendIds]
  )

  const filteredFriends = useMemo(() => {
    if (!search.trim()) return friends
    const query = search.toLowerCase()
    return friends.filter((friend) =>
      [friend.name, friend.rollNumber, friend.department, friend.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    )
  }, [friends, search])

  useEffect(() => {
    if (!open) {
      setSearch('')
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="friends-overlay"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          variants={OVERLAY_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exiting"
          transition={OVERLAY_TRANSITION}
          onClick={onClose}
        >
          <motion.div
            variants={MODAL_VARIANTS}
            transition={MODAL_TRANSITION}
            className="relative w-full max-w-[680px] max-h-[85vh] flex flex-col overflow-hidden rounded-2xl bg-white border border-hairline shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="friends-list-title"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#181d26]/10 text-[#181d26]">
                  <UsersIcon size={18} />
                </div>
                <div>
                  <h2 id="friends-list-title" className="font-display text-[18px] font-bold text-gray-900">
                    Friends
                  </h2>
                  <p className="font-mono text-[11px] text-gray-500">
                    {friends.length} friend{friends.length !== 1 ? 's' : ''}
                    {mutuals.length > 0 && ` · ${mutuals.length} mutual friend${mutuals.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              >
                <X size={18} />
              </button>
            </div>

            {mutuals.length > 0 && (
              <div className="px-5 py-3 border-b border-hairline bg-gray-50/60">
                <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2">
                  Mutual friends
                </p>
                <div className="flex flex-wrap gap-2">
                  {mutuals.map((friend) => (
                    <Link
                      key={`mutual-${friend._id}`}
                      to={`/profile/${friend._id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-hairline text-[12px] font-medium text-gray-700 hover:border-[#181d26]/30 hover:text-[#181d26] transition-colors"
                    >
                      <FriendAvatar friend={friend} />
                      {friend.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="px-5 py-3 border-b border-hairline">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search friends"
                aria-label="Search friends"
                className="w-full h-10 px-4 rounded-xl bg-gray-50 border border-hairline text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#181d26]/40 focus:ring-2 focus:ring-[#181d26]/10 transition-shadow"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-hairline">
                      <div className="w-10 h-10 rounded-full bg-gray-200 skeleton-shimmer" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 bg-gray-200 rounded skeleton-shimmer" />
                        <div className="h-2.5 w-24 bg-gray-200 rounded skeleton-shimmer" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error || friends.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mx-auto mb-3">
                    <User size={24} className="text-gray-400" />
                  </div>
                  <p className="font-sans text-[15px] text-gray-500">
                    {error ? 'Unable to load friends.' : 'No friends yet.'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredFriends.map((friend) => {
                    const isMutual = currentFriendIds.has(friend._id.toString())
                    return (
                      <Link
                        key={friend._id}
                        to={`/profile/${friend._id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl border border-hairline hover:bg-gray-50 hover:border-[#181d26]/20 transition-colors"
                      >
                        <FriendAvatar friend={friend} />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-[14px] font-medium text-gray-900 truncate">
                            {friend.name}
                          </p>
                          <p className="font-mono text-[11px] text-gray-500 truncate">
                            {friend.rollNumber || friend.role}
                            {friend.department ? ` · ${friend.department}` : ''}
                          </p>
                          {isMutual && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-[#181d26]/10 text-[#181d26] text-[10px] font-medium">
                              Mutual friend
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                  {filteredFriends.length === 0 && (
                    <div className="py-12 text-center text-[14px] text-gray-500">
                      No friends match your search.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}