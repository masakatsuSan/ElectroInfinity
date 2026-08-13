import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStudents, getBatches } from '../api/students'

export default function Directory() {
  const [batch,  setBatch]  = useState('')
  const [search, setSearch] = useState('')

  const { data: batchData } = useQuery({
    queryKey: ['batches'],
    queryFn: () => getBatches().then(r => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['students', batch],
    queryFn: () => getStudents(batch ? { batch } : {}).then(r => r.data),
  })

  const batches  = batchData?.data || []
  const students = (data?.data || []).filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.regNumber?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="container pt-28 pb-20 min-h-screen">
      <span className="eyebrow">Faculty / Admin Only</span>
      <h1 className="font-display font-black text-[clamp(32px,7vw,60px)] leading-none tracking-tight mb-8">
        Student Directory
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Batch filter */}
        <div className="flex gap-0 flex-wrap">
          <button
            onClick={() => setBatch('')}
            className={`font-mono text-[10px] uppercase tracking-wider px-3 py-2 border transition-colors ${
              batch === '' ? 'border-vs text-vs bg-violet/10' : 'border-white/15 text-dim hover:text-ink'
            }`}
          >
            All Batches
          </button>
          {batches.map(b => (
            <button key={b} onClick={() => setBatch(b)}
              className={`font-mono text-[10px] uppercase tracking-wider px-3 py-2 border-t border-b border-r transition-colors ${
                batch === b ? 'border-vs text-vs bg-violet/10' : 'border-white/15 text-dim hover:text-ink'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name / roll no…"
          className="ml-auto font-mono text-[12px] bg-transparent border-b border-white/15 focus:border-vs pb-1 outline-none placeholder:opacity-30 w-52 transition-colors"
        />
      </div>

      {/* Count */}
      <p className="font-mono text-[10px] uppercase tracking-wider text-dim mb-4">
        {students.length} student{students.length !== 1 ? 's' : ''}
        {batch ? ` · Batch ${batch}` : ''}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-white/7">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-bg p-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-3" />
              <div className="h-3 bg-white/10 rounded w-24 mx-auto mb-2" />
              <div className="h-2 bg-white/10 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <p className="text-dim text-[14px] py-16 text-center border-t border-white/8">
          {batch
            ? `No verified students in batch ${batch} yet.`
            : 'No verified students yet. Approve accounts from Admin → Students.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-white/7">
          {students.map(s => {
            const initials = s.name
              ?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || 'S'
            return (
              <div key={s._id} className="bg-bg p-5 text-center flex flex-col items-center gap-2 hover:bg-panel transition-colors">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-violet/12 flex items-center justify-center overflow-hidden border border-white/8 mb-1 flex-shrink-0">
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-black text-[18px] text-vs">{initials}</span>
                  )}
                </div>

                <p className="text-[13px] font-semibold leading-tight truncate w-full">{s.name}</p>

                {s.rollNumber && (
                  <p className="font-mono text-[9.5px] text-dim uppercase tracking-wider">{s.rollNumber}</p>
                )}
                {s.regNumber && (
                  <p className="font-mono text-[9px] text-dim/70 uppercase tracking-wider">{s.regNumber}</p>
                )}
                <span className="font-mono text-[8.5px] text-vs/70 uppercase tracking-wider border border-vs/20 px-2 py-0.5 mt-1">
                  {s.batch}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
