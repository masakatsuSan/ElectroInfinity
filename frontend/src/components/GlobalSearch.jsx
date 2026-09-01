import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, UserCheck, UserRound } from 'lucide-react'
import api from '../api/axios'
import { searchUsers } from '../api/profile'
import { useAuth } from '../context/AuthContext'

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
  const [followStates, setFollowStates] = useState({})
  const inputRef  = useRef(null)
  const navigate  = useNavigate()
  const debounced = useDebounce(query)
  const { user: currentUser } = useAuth()

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!debounced.trim()) { setResults([]); return }
    setLoading(true)
    searchUsers(debounced)
      .then((res) => {
        const users = (res.data.data || []).slice(0, 6)
        const hits = users.map((u) => {
          const alreadyFollowing = u.isFollowing || false
          const followsMe = u.followsMe || false
          setFollowStates((prev) => ({ ...prev, [u._id]: { following: alreadyFollowing, followsMe: followsMe } }))
          return {
            type: 'User',
            label: u.name,
            sub: `${u.profile?.department || ''}${u.department ? ' · ' : ''}${u.batch ? `Batch ${u.batch}` : ''}`,
            to: `/profile/${u._id}`,
            avatar: u.photo,
            userId: u._id,
            isFollowing: alreadyFollowing,
            followsMe: followsMe,
          }
        })
        setResults(hits)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debounced])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = (to) => { navigate(to); onClose?.() }

  const handleFollowToggle = async (userId, currentFollowing, currentFollowsMe) => {
    if (!currentUser?._id) return
    try {
      const res = await import('../api/profile').then(m => m.toggleFollow(userId))
      const { isFollowing } = res.data.data
      setFollowStates((prev) => ({ ...prev, [userId]: { following: isFollowing, followsMe: currentFollowsMe } }))
      setResults((prev) => prev.map((r) =>
        r.userId === userId ? { ...r, isFollowing: isFollowing, followsMe: currentFollowsMe } : r
      ))
    } catch (err) {
      console.error(err)
    }
  }

  const getFollowButton = (r) => {
    if (!currentUser?._id || r.userId === currentUser._id) return null
    const state = followStates[r.userId] || { following: r.isFollowing || false, followsMe: r.followsMe || false }
    const { following, followsMe } = state

    if (following) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleFollowToggle(r.userId, following, followsMe) }}
          className="flex-shrink-0 px-3 py-1.5 text-[12px] font-semibold rounded-full bg-soft-stone text-ink border border-hairline hover:bg-soft-stone/80 transition-colors"
        >
          <UserCheck size={12} />
        </button>
      )
    }
    if (followsMe) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleFollowToggle(r.userId, following, followsMe) }}
          className="flex-shrink-0 px-3 py-1.5 text-[12px] font-semibold rounded-full bg-ink text-canvas hover:bg-ink/90 transition-colors"
        >
          <UserRound size={12} />
        </button>
      )
    }
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleFollowToggle(r.userId, following, followsMe) }}
        className="flex-shrink-0 px-3 py-1.5 text-[12px] font-semibold rounded-full bg-ink text-canvas hover:bg-ink/90 transition-colors"
      >
        <UserPlus size={12} />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-canvas border-b border-divider-soft shadow-2xl">
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
            className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-48 hover:text-ink border border-divider-soft px-2 py-1 flex-shrink-0 rounded bg-surface-pearl">
            ESC
          </button>
        </div>

        {(loading || results.length > 0) && (
          <div className="page-wrap pb-4">
            {loading ? (
              <div className="flex flex-col gap-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 bg-surface-pearl rounded animate-pulse border border-divider-soft" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {results.map((r, i) => (
                  <div key={i} onClick={() => go(r.to)}
                    className="flex items-center gap-3 py-3 border-b border-divider-soft last:border-b-0 text-left hover:bg-surface-pearl -mx-5 px-5 transition-colors group cursor-pointer">
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
                    {r.type === 'User' && getFollowButton(r)}
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
      </div>
    </div>
  )
}

