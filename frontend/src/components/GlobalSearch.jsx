import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

// Debounce hook — waits until user stops typing before calling the function
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
  const inputRef  = useRef(null)
  const navigate  = useNavigate()
  const debounced = useDebounce(query)

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Search whenever debounced query changes
  useEffect(() => {
    if (!debounced.trim()) { setResults([]); return }
    setLoading(true)

    // Run 3 searches in parallel
    Promise.allSettled([
      api.get('/notices',   { params: { limit: 3 } }),
      api.get('/faculty'),
      api.get('/resources', { params: { limit: 3 } }),
      api.get('/events'),
    ]).then(([nRes, fRes, rRes, eRes]) => {
      const q = debounced.toLowerCase()
      const hits = []

      // Notices
      if (nRes.status === 'fulfilled') {
        nRes.value.data.data
          .filter(n => n.title.toLowerCase().includes(q))
          .slice(0, 3)
          .forEach(n => hits.push({ type:'Notice', label: n.title, sub: n.category, to:'/resources' }))
      }
      // Faculty
      if (fRes.status === 'fulfilled') {
        fRes.value.data.data
          .filter(f => f.name.toLowerCase().includes(q) || f.specialization?.toLowerCase().includes(q))
          .slice(0, 2)
          .forEach(f => hits.push({ type:'Faculty', label: f.name, sub: f.designation, to:'/faculty' }))
      }
      // Resources
      if (rRes.status === 'fulfilled') {
        rRes.value.data.data
          .filter(r => r.title.toLowerCase().includes(q))
          .slice(0, 3)
          .forEach(r => hits.push({ type:'Resource', label: r.title, sub: `Sem ${r.semester} · ${r.type}`, to:'/resources' }))
      }
      // Events
      if (eRes.status === 'fulfilled') {
        eRes.value.data.data
          .filter(e => e.title.toLowerCase().includes(q))
          .slice(0, 2)
          .forEach(e => hits.push({ type:'Event', label: e.title, sub: e.type, to:'/events' }))
      }

      setResults(hits)
      setLoading(false)
    })
  }, [debounced])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = (to) => { navigate(to); onClose?.() }

  const typeColor = {
    Notice: 'text-vs', Faculty: 'text-green',
    Resource: 'text-yellow-400', Event: 'text-orange-400',
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Search panel */}
      <div className="relative z-10 bg-canvas border-b border-divider-soft shadow-2xl">
        <div className="page-wrap flex items-center gap-3 py-4">
          <svg className="text-ink-muted-48 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search faculty, notices, resources, events…"
            className="flex-1 bg-transparent text-ink text-[15px] outline-none placeholder:text-ink-muted-48"
          />
          <button onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-48 hover:text-ink border border-divider-soft px-2 py-1 flex-shrink-0 rounded bg-surface-pearl">
            ESC
          </button>
        </div>

        {/* Results */}
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
                  <button key={i} onClick={() => go(r.to)}
                    className="flex items-center gap-3 py-3 border-b border-divider-soft last:border-b-0 text-left hover:bg-surface-pearl -mx-5 px-5 transition-colors group">
                    <span className={`font-mono text-[10px] font-bold uppercase tracking-wider w-20 flex-shrink-0 ${typeColor[r.type]}`}>
                      {r.type}
                    </span>
                    <span className="text-[15px] font-medium text-ink flex-1 truncate group-hover:text-primary transition-colors">{r.label}</span>
                    <span className="font-mono text-[10px] font-semibold text-ink-muted-48 flex-shrink-0 hidden sm:block">{r.sub}</span>
                  </button>
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
