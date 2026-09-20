import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { searchUsers, getProfileViews } from '../api/profile'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { OVERLAY_VARIANTS, OVERLAY_TRANSITION, EASE } from '../utils/motion'
import FriendActionButton from './FriendActionButton'

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function GlobalSearch({ onClose }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recentViews, setRecentViews] = useState([])
  const inputRef  = useRef(null)
  const navigate  = useNavigate()
  const debounced = useDebounce(query)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    const scrollY = window.scrollY
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = '-' + scrollY + 'px'
    document.body.style.width = '100%'

    return () => {
      const savedScrollY = parseInt(document.body.style.top || '0', 10)
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, savedScrollY)
    }
  }, [])

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (debounced.trim()) {
      setLoading(true)
      searchUsers(debounced)
        .then((res) => {
          const users = (res.data.data || []).slice(0, 6)
          const hits = users.map((u) => {
            return {
              type: 'User',
              label: u.name,
              sub: `${u.profile?.department || ''}${u.department ? ' · ' : ''}${u.batch ? `Batch ${u.batch}` : ''}`,
              to: `/profile/${u._id}`,
              avatar: u.photo,
              userId: u._id,
              friendStatus: u.friendStatus || 'none',
            }
          })
          setResults(hits)
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    } else {
      setResults([])
      setLoading(false)
      if (currentUser?._id) {
        getProfileViews()
          .then((res) => {
            const viewers = (res.data.data || []).slice(0, 5)
            setRecentViews(viewers.map((v) => ({
              type: 'User',
              label: v.name,
              sub: `${v.profile?.department || ''}${v.profile?.department ? ' · ' : ''}${v.batch ? `Batch ${v.batch}` : ''}`,
              to: `/profile/${v._id}`,
              avatar: v.photo,
              userId: v._id,
              friendStatus: 'none',
            })))
          })
          .catch(() => setRecentViews([]))
      }
    }
  }, [debounced, currentUser?._id])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = (to) => { navigate(to); onClose?.() }

  const handleFriendUpdate = (userId, updates) => {
    setResults((prev) => prev.map((r) =>
      r.userId === userId ? { ...r, ...updates } : r
    ))
    setRecentViews((prev) => prev.map((r) =>
      r.userId === userId ? { ...r, ...updates } : r
    ))
  }

  const displayItems = query.trim() ? results : recentViews
  const showHeader = !query.trim() && recentViews.length > 0

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
        initial="hidden"
        animate="visible"
        exit="exiting"
        variants={OVERLAY_VARIANTS}
        transition={OVERLAY_TRANSITION}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative z-10 bg-canvas border-b border-divider-soft shadow-2xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.9 }}
        >
        <div className="page-wrap flex items-center gap-3 py-4">
          <svg className="text-ink-muted-48 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search students, faculty…"
            className="flex-1 bg-transparent text-ink text-[15px] outline-none placeholder:text-ink-muted-48"
          />
          <button onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-48 hover:text-ink border border-divider-soft px-2 py-1 flex-shrink-0 rounded bg-white">
            ESC
          </button>
        </div>

        {showHeader && (
          <div className="page-wrap pb-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48 flex items-center gap-1.5">
              <Clock size={12} /> Recently Viewed
            </p>
          </div>
        )}

        {(loading || displayItems.length > 0) && (
          <div className="page-wrap pb-4">
            {loading ? (
              <div className="flex flex-col gap-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 bg-white rounded skeleton-shimmer border border-divider-soft" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {displayItems.map((r, i) => (
                  <div key={i} onClick={() => go(r.to)}
                    className="flex items-center gap-3 py-3 border-b border-divider-soft last:border-b-0 text-left hover:bg-white -mx-5 px-5 transition-colors group cursor-pointer">
                    {r.avatar ? (
                      <img src={r.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider w-20 flex-shrink-0 text-primary">
                        {r.type}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[15px] font-medium text-ink flex-1 truncate group-hover:text-primary transition-colors">{r.label}</span>
                      {r.sub && <span className="font-mono text-[10px] font-semibold text-ink-muted-48 block sm:mt-0.5">{r.sub}</span>}
                    </div>
                    {r.type === 'User' && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <FriendActionButton
                          userId={r.userId}
                          friendStatus={r.friendStatus || 'none'}
                          onUpdate={(updates) => handleFriendUpdate(r.userId, updates)}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="page-wrap pb-4">
            <p className="text-ink-muted-48 text-[14px] font-medium py-2">No results for "{query}"</p>
          </div>
        )}
      </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
