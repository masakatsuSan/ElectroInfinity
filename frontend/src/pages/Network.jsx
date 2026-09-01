import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCollegeNetwork } from '../api/profile'
import { useAuth } from '../context/AuthContext'
import { Search, UserPlus, UserCheck, UserRound } from 'lucide-react'
import FollowButton from '../components/FollowButton'
import SEO from '../components/SEO'

export default function Network() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['network', search],
    queryFn: () => getCollegeNetwork(search).then(r => r.data.data),
  })

  const [peers, setPeers] = useState(data || [])

  useEffect(() => {
    setPeers(data || [])
  }, [data])

  const filtered = useMemo(() => {
    if (!search.trim()) return peers
    const q = search.toLowerCase()
    return peers.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.rollNumber?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q)
    )
  }, [peers, search])

  const students = filtered.filter(p => p.role === 'student' || p.role === 'cr')
  const faculty = filtered.filter(p => p.role === 'faculty')

  const displayList = selectedTab === 'students' ? students : selectedTab === 'faculty' ? faculty : filtered

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO title="Network | Electro Infinity" description="Connect with your college mates." />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Connect
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Network
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Discover and connect with your college mates across batches and departments.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md mb-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll number, or department…"
            className="w-full bg-soft-stone/60 border border-hairline rounded-xl pl-9 pr-4 py-2.5 text-[14px] font-sans text-ink placeholder:text-ink-muted-48 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto p-1 bg-surface-pearl border border-divider-soft rounded-[999px] w-max max-w-full">
          {['all', 'students', 'faculty'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`font-sans text-[13px] font-bold uppercase tracking-[0.04em] px-5 py-2.5 rounded-[999px] transition-all whitespace-nowrap ${
                selectedTab === tab
                  ? 'bg-ink text-canvas shadow-sm'
                  : 'text-[#696969] bg-transparent hover:text-ink hover:bg-canvas-parchment'
              }`}
            >
              {tab === 'all' ? 'Everyone' : tab === 'students' ? 'Students' : 'Faculty'}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="font-mono text-[12px] uppercase tracking-wider text-slate mb-6">
          {displayList.length} {displayList.length === 1 ? 'person' : 'people'}
          {search ? ` matching "${search}"` : ''}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-hairline bg-soft-stone/40 rounded-2xl h-[160px] animate-pulse" />
            ))}
          </div>
        ) : displayList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayList.map((peer) => (
              <div key={peer._id} className="border border-divider-soft bg-canvas rounded-2xl p-6 shadow-card hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden flex-shrink-0">
                  {peer.photo ? (
                    <img src={peer.photo} alt={peer.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-[18px] text-ink-muted-48">
                      {peer.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${peer._id}`} className="font-display text-[16px] font-bold text-ink hover:text-action-blue transition-colors truncate block">
                    {peer.name}
                  </Link>
                  <p className="font-mono text-[12px] text-slate truncate">
                    {peer.rollNumber || peer.role}
                  </p>
                  {peer.department && (
                    <p className="font-sans text-[13px] text-ink-muted-80 truncate">
                      {peer.department}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <FollowButton
                    userId={peer._id}
                    isFollowing={peer.isFollowing}
                    followsMe={peer.followsMe}
                    onUpdate={(updates) => {
                      const idx = peers.findIndex(p => p._id === peer._id)
                      if (idx !== -1) {
                        peers[idx] = { ...peers[idx], ...updates }
                      }
                    }}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-hairline bg-soft-stone rounded-2xl p-16 text-center">
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-slate block mb-2">
              No Results
            </span>
            <p className="font-sans text-[15px] text-body-muted">
              {search ? 'No one matches your search.' : 'No college mates found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
