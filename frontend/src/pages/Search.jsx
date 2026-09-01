import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, UserCheck, UserRound, SlidersHorizontal, X, TrendingUp, Sparkles } from 'lucide-react'
import { searchUsers, getTrendingUsers, getSuggestedUsers } from '../api/profile'
import { useAuth } from '../context/AuthContext'
import FollowButton from '../components/FollowButton'
import SEO from '../components/SEO'

const ITEMS_PER_PAGE = 12

export default function SearchPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    batch: '',
    role: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showTrending, setShowTrending] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery, filters, page],
    queryFn: () =>
      searchUsers(debouncedQuery, {
        ...filters,
        page,
        limit: ITEMS_PER_PAGE,
      }).then((r) => r.data),
    enabled: debouncedQuery.length >= 1 || Object.values(filters).some(Boolean),
  })

  const { data: trendingData } = useQuery({
    queryKey: ['trendingUsers'],
    queryFn: () => getTrendingUsers().then((r) => r.data.data),
    enabled: showTrending,
  })

  const { data: suggestedData } = useQuery({
    queryKey: ['suggestedUsersSearch'],
    queryFn: () => getSuggestedUsers().then((r) => r.data.data),
  })

  const results = data?.data || []
  const pagination = data?.pagination || {}
  const hasMore = page < (pagination.totalPages || 0)
  const trending = trendingData?.slice(0, 5) || []
  const suggested = suggestedData?.slice(0, 5) || []

  const resetSearch = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    setPage(1)
    setFilters({ department: '', semester: '', batch: '', role: '' })
    setShowTrending(false)
  }, [])

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const showSearchResults = debouncedQuery.length >= 1 || Object.values(filters).some(Boolean)

  return (
    <div className="min-h-screen bg-canvas pt-28 pb-20">
      <SEO title="Discover & Connect | Electro Infinity" description="Find and connect with students, seniors, and faculty." />

      <div className="max-w-[1280px] mx-auto px-4 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Discover & Connect
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Find People
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Search by name, username, department, semester, or batch to discover and connect with your college network.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search by name, username, department, batch…"
            className="w-full bg-surface-pearl border border-divider-soft rounded-2xl pl-12 pr-24 py-4 text-[15px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary/40 transition-colors shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                onClick={resetSearch}
                className="p-2 rounded-full hover:bg-soft-stone text-slate transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                showFilters || Object.values(filters).some(Boolean)
                  ? 'bg-ink text-canvas'
                  : 'bg-soft-stone text-ink hover:bg-soft-stone/80'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface-pearl border border-divider-soft rounded-2xl p-5 mb-8 shadow-sm overflow-hidden"
          >
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[180px]">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1.5">Department</label>
                <input
                  type="text"
                  value={filters.department}
                  onChange={(e) => updateFilter('department', e.target.value)}
                  placeholder="e.g. Electrical Engineering"
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-4 py-2.5 text-[14px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1.5">Semester</label>
                <select
                  value={filters.semester}
                  onChange={(e) => updateFilter('semester', e.target.value)}
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-4 py-2.5 text-[14px] font-sans text-ink focus:outline-none focus:border-primary/40 transition-colors"
                >
                  <option value="">Any</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1.5">Batch</label>
                <input
                  type="text"
                  value={filters.batch}
                  onChange={(e) => updateFilter('batch', e.target.value)}
                  placeholder="e.g. 2027"
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-4 py-2.5 text-[14px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted-48 mb-1.5">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => updateFilter('role', e.target.value)}
                  className="w-full bg-canvas border border-divider-soft rounded-xl px-4 py-2.5 text-[14px] font-sans text-ink focus:outline-none focus:border-primary/40 transition-colors"
                >
                  <option value="">Everyone</option>
                  <option value="student">Students</option>
                  <option value="cr">Class Reps</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Trending Section */}
        {!showSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-coral" />
              <h3 className="font-display text-[20px] font-bold text-ink">Trending Now</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.map((user, idx) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="border border-divider-soft bg-canvas rounded-2xl p-5 shadow-card hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-[18px] text-ink-muted-48">
                        {user.name?.charAt(0)}
                      </span>
                    )}
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[16px] font-bold text-ink group-hover:text-primary transition-colors truncate">
                      {user.name}
                    </p>
                    <p className="font-mono text-[12px] text-slate truncate">
                      {user.rollNumber ? `@${user.rollNumber.toLowerCase()}` : user.role}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {user.department && (
                        <span className="font-sans text-[12px] text-ink-muted-80">{user.department}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <FollowButton
                      userId={user._id}
                      isFollowing={user.isFollowing}
                      followsMe={user.followsMe}
                      onUpdate={(updates) => {
                        const idx = results.findIndex((r) => r._id === user._id)
                        if (idx !== -1) {
                          results[idx] = { ...results[idx], ...updates }
                        }
                      }}
                      size="sm"
                    />
                  </div>
                </motion.div>
              ))}
              {trending.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="font-sans text-[14px] text-ink-muted-80">No trending users this week.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Suggested Section */}
        {!showSearchResults && suggested.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-action-blue" />
              <h3 className="font-display text-[20px] font-bold text-ink">People You May Know</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggested.map((user, idx) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="border border-divider-soft bg-canvas rounded-2xl p-5 shadow-card hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-[18px] text-ink-muted-48">
                        {user.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[16px] font-bold text-ink group-hover:text-primary transition-colors truncate">
                      {user.name}
                    </p>
                    <p className="font-mono text-[12px] text-slate truncate">
                      {user.rollNumber ? `@${user.rollNumber.toLowerCase()}` : user.role}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      {user.department && (
                        <span className="font-sans text-[12px] text-ink-muted-80">{user.department}</span>
                      )}
                      {user.batch && (
                        <span className="font-mono text-[11px] text-ink-muted-48 uppercase tracking-wider">Batch {user.batch}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <FollowButton
                      userId={user._id}
                      isFollowing={user.isFollowing}
                      followsMe={user.followsMe}
                      onUpdate={(updates) => {
                        const idx = results.findIndex((r) => r._id === user._id)
                        if (idx !== -1) {
                          results[idx] = { ...results[idx], ...updates }
                        }
                      }}
                      size="sm"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search Results */}
        <AnimatePresence>
          {showSearchResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border border-hairline bg-soft-stone/40 rounded-2xl h-[160px] animate-pulse" />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <p className="font-mono text-[12px] uppercase tracking-wider text-slate">
                      {pagination.total || 0} result{pagination.total !== 1 ? 's' : ''}
                      {debouncedQuery ? ` for "${debouncedQuery}"` : ''}
                    </p>
                    {isFetching && <span className="font-mono text-[11px] text-ink-muted-48 animate-pulse">Updating…</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((user, idx) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => navigate(`/profile/${user._id}`)}
                        className="border border-divider-soft bg-canvas rounded-2xl p-6 shadow-card hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
                      >
                        <div className="w-14 h-14 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden flex-shrink-0">
                          {user.photo ? (
                            <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-display font-bold text-[18px] text-ink-muted-48">
                              {user.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-[16px] font-bold text-ink group-hover:text-primary transition-colors truncate">
                            {user.name}
                          </p>
                          <p className="font-mono text-[12px] text-slate truncate">
                            {user.rollNumber ? `@${user.rollNumber.toLowerCase()}` : user.email}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            {user.department && (
                              <span className="font-sans text-[12px] text-ink-muted-80">{user.department}</span>
                            )}
                            {user.department && user.semester && <span className="text-ink-muted-48 text-[10px]">·</span>}
                            {user.semester && (
                              <span className="font-sans text-[12px] text-ink-muted-80">Sem {user.semester}</span>
                            )}
                            {user.batch && (
                              <>
                                <span className="text-ink-muted-48 text-[10px]">·</span>
                                <span className="font-mono text-[11px] text-ink-muted-48 uppercase tracking-wider">{user.batch} Batch</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <FollowButton
                            userId={user._id}
                            isFollowing={user.isFollowing}
                            followsMe={user.followsMe}
                            onUpdate={(updates) => {
                              const idx = results.findIndex((r) => r._id === user._id)
                              if (idx !== -1) {
                                results[idx] = { ...results[idx], ...updates }
                              }
                            }}
                            size="sm"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="mt-10 text-center">
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={isFetching}
                        className="inline-flex items-center gap-2 bg-ink text-canvas px-6 py-3 rounded-full text-[14px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {isFetching ? 'Loading…' : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              ) : !isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-hairline bg-soft-stone rounded-2xl p-16 text-center"
                >
                  <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-slate block mb-2">
                    No Students Found
                  </span>
                  <p className="font-sans text-[15px] text-body-muted max-w-md mx-auto">
                    No students match your search. Try adjusting your query or filters to find what you're looking for.
                  </p>
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when not searching */}
        {!showSearchResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-hairline bg-soft-stone rounded-2xl p-16 text-center"
          >
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-slate block mb-2">
              Start Searching
            </span>
            <p className="font-sans text-[15px] text-body-muted max-w-md mx-auto">
              Type a name, username, department, or batch to discover students, seniors, and faculty.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
