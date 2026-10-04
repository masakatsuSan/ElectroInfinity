import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Loader2, Search, X } from 'lucide-react'
import { searchUsers, getProfileViews } from '../api/profile'
import { useAuth } from '../context/AuthContext'
import FriendActionButton from './FriendActionButton'
import { cn } from '../utils/cn'

/**
 * Inline desktop search.
 *
 * Deliberately NOT the GlobalSearch overlay: the field lives in the top bar and
 * results drop down beneath it, so searching never takes over the viewport or
 * locks body scroll. GlobalSearch still serves the mobile Navbar.
 */

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const subLabel = (u) =>
  `${u.profile?.department || ''}${u.profile?.department ? ' · ' : ''}${u.batch ? `Batch ${u.batch}` : ''}`

const toHit = (u) => ({
  label: u.name,
  sub: subLabel(u),
  to: `/profile/${u._id}`,
  avatar: u.photo,
  userId: u._id,
  friendStatus: u.friendStatus || 'none',
})

export default function TopBarSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState([])
  const [recentViews, setRecentViews] = useState([])
  const [loading, setLoading] = useState(false)

  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const debounced = useDebounce(query)
  const { user: currentUser } = useAuth()

  /* Ctrl+K / Cmd+K focuses the inline field rather than opening a modal. */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const term = debounced.trim()
    let cancelled = false

    if (!term) {
      setResults([])
      setLoading(false)
      if (!currentUser?._id) {
        setRecentViews([])
        return
      }
      getProfileViews()
        .then((res) => {
          if (cancelled) return
          setRecentViews((res.data.data || []).slice(0, 5).map(toHit))
        })
        .catch(() => {
          if (!cancelled) setRecentViews([])
        })
      return
    }

    setLoading(true)
    searchUsers(term)
      .then((res) => {
        if (cancelled) return
        setResults((res.data.data || []).slice(0, 6).map(toHit))
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debounced, currentUser?._id])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      inputRef.current?.blur()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (to) => {
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
    navigate(to)
  }

  const handleFriendUpdate = (userId, updates) => {
    const patch = (prev) => prev.map((r) => (r.userId === userId ? { ...r, ...updates } : r))
    setResults(patch)
    setRecentViews(patch)
  }

  const term = query.trim()
  const items = term ? results : recentViews
  const showRecentHeader = !term && recentViews.length > 0
  const showPanel = open && (loading || term || recentViews.length > 0)

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={cn(
          'flex h-9 w-[300px] items-center gap-2 rounded-full border pl-3 pr-2 transition-colors duration-200',
          open ? 'border-primary/40 bg-white' : 'border-hairline bg-surface-soft hover:bg-soft-stone'
        )}
      >
        <Search size={16} strokeWidth={1.75} className="flex-shrink-0 text-muted" />

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search students, faculty…"
          aria-label="Search students and faculty"
          className="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-ink outline-none placeholder:text-muted"
        />

        {loading ? (
          <Loader2 size={14} className="flex-shrink-0 animate-spin text-muted" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-soft-stone hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
          >
            <X size={12} strokeWidth={2} />
          </button>
        ) : (
          <kbd className="flex-shrink-0 rounded border border-hairline bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted">
            Ctrl K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[380px] overflow-hidden rounded-xl border border-hairline bg-white shadow-modal">
          {showRecentHeader && (
            <p className="flex items-center gap-1.5 border-b border-hairline px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
              <Clock size={11} /> Recently Viewed
            </p>
          )}

          <div data-lenis-prevent className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5">
            {loading ? (
              <div className="space-y-1.5 p-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton-shimmer h-12 rounded-lg bg-surface-soft" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-2.5 py-5 text-center font-sans text-[13px] text-muted">
                No results for &ldquo;{term}&rdquo;
              </p>
            ) : (
              items.map((r) => (
                <div
                  key={r.userId}
                  role="button"
                  tabIndex={0}
                  onClick={() => go(r.to)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') go(r.to)
                  }}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors duration-200 hover:bg-surface-soft focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
                >
                  {r.avatar ? (
                    <img src={r.avatar} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-soft font-mono text-[11px] font-bold uppercase text-muted">
                      {(r.label || '?').charAt(0)}
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-sans text-[13px] font-medium text-ink transition-colors duration-200 group-hover:text-primary">
                      {r.label}
                    </span>
                    {r.sub && <span className="block truncate font-mono text-[10px] text-muted">{r.sub}</span>}
                  </span>

                  <span onClick={(e) => e.stopPropagation()}>
                    <FriendActionButton
                      userId={r.userId}
                      friendStatus={r.friendStatus || 'none'}
                      onUpdate={(updates) => handleFriendUpdate(r.userId, updates)}
                      size="sm"
                    />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}