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
            className={`font-mono text-[10px] uppercase tracking-wider px-3 py-2 border border-hairline transition-colors rounded-l-xl ${
              batch === '' ? 'border-ink text-canvas bg-ink' : 'border-hairline text-ink-muted-80 bg-white hover:text-ink'
            }`}
          >
            All Batches
          </button>
          {batches.map((b, i) => (
            <button key={b} onClick={() => setBatch(b)}
              className={`font-mono text-[10px] uppercase tracking-wider px-3 py-2 border-t border-b border-r border-hairline transition-colors ${
                i === batches.length - 1 ? 'rounded-r-xl' : ''
              } ${
                batch === b ? 'border-ink text-canvas bg-ink' : 'border-hairline text-ink-muted-80 bg-white hover:text-ink'
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
          className="ml-auto font-mono text-[12px] bg-white border border-hairline focus:border-ink rounded-xl px-3 py-2 outline-none placeholder:text-ink-muted-48 w-52 transition-colors"
        />
      </div>

      {/* Count */}
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-80 mb-4">
        {students.length} student{students.length !== 1 ? 's' : ''}
        {batch ? ` · Batch ${batch}` : ''}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-5 bg-white border border-hairline rounded-2xl animate-pulse">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-soft-stone" />
              <div className="h-3 mx-auto mb-2 rounded w-24 bg-soft-stone" />
              <div className="h-2 mx-auto rounded w-16 bg-soft-stone" />
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <p className="text-ink-muted-80 text-[14px] py-16 text-center border-t border-hairline">
          {batch
            ? `No verified students in batch ${batch} yet.`
            : 'No verified students yet. Approve accounts from Admin → Students.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {students.map(s => {
            const initials = s.name
              ?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || 'S'
            return (
              <div key={s._id} className="p-5 text-center flex flex-col items-center gap-2 transition-colors bg-white border border-hairline rounded-2xl hover:border-ink/20 hover:shadow-md">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-soft-stone flex items-center justify-center overflow-hidden border border-hairline mb-1 flex-shrink-0">
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-black text-[18px] text-ink">{initials}</span>
                  )}
                </div>

                <p className="text-[13px] font-semibold leading-tight truncate w-full">{s.name}</p>

                {s.rollNumber && (
                  <p className="font-mono text-[9.5px] text-ink-muted-80 uppercase tracking-wider">{s.rollNumber}</p>
                )}
                {s.regNumber && (
                  <p className="font-mono text-[9px] text-ink-muted-80/70 uppercase tracking-wider">{s.regNumber}</p>
                )}
                <span className="font-mono text-[8.5px] text-deep-green uppercase tracking-wider border border-deep-green/20 bg-pale-green px-2 py-0.5 mt-1 rounded-full">
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
