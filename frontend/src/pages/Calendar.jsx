import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Filter, Search, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCalendarEntries } from '../api/calendar'
import SEO from '../components/SEO'

const TYPE_FILTERS = [
  { key: '', label: 'All' },
  { key: 'exam', label: 'Exam' },
  { key: 'holiday', label: 'Holiday' },
  { key: 'registration', label: 'Registration' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'event', label: 'Event' },
]

const TYPE_COLORS = {
  exam: {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500/20',
    accent: 'border-red-500',
    dot: 'bg-red-500',
  },
  holiday: {
    bg: 'bg-pale-green',
    text: 'text-deep-green',
    border: 'border-green-200',
    accent: 'border-green-500',
    dot: 'bg-green-500',
  },
  registration: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
    accent: 'border-blue-500',
    dot: 'bg-blue-500',
  },
  deadline: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    border: 'border-orange-500/20',
    accent: 'border-orange-500',
    dot: 'bg-orange-500',
  },
  event: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/20',
    accent: 'border-purple-500',
    dot: 'bg-purple-500',
  },
  other: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600',
    border: 'border-gray-500/20',
    accent: 'border-gray-400',
    dot: 'bg-gray-400',
  },
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Calendar() {
  const { user } = useAuth()
  const [typeFilter, setTypeFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', typeFilter, batchFilter],
    queryFn: () =>
      getCalendarEntries({
        type: typeFilter || undefined,
        batch: batchFilter || undefined,
      }).then((r) => r.data),
  })

  const entries = useMemo(() => {
    const all = data?.data || []
    return [...all].sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [data])

  const canAddEntry =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'cr'

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Academic Calendar | Electro Infinity"
        description="Important dates, exams, holidays, registrations, deadlines, and events for AGEMC Electrical Engineering."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            <CalendarDays size={14} className="inline mr-1.5 -mt-0.5" />
            Schedule & Deadlines
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Academic Calendar
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Stay on top of exams, holidays, registrations, deadlines, and department events throughout the semester.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1 max-w-xs">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body-muted pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-canvas border border-hairline text-ink pl-10 pr-4 py-2.5 text-[14px] font-sans rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body-muted pointer-events-none" />
            <input
              type="text"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              placeholder="Filter by batch (e.g. 2024)"
              className="w-full bg-canvas border border-hairline text-ink pl-10 pr-4 py-2.5 text-[14px] font-sans rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-body-muted"
            />
          </div>
          {canAddEntry && (
            <button className="button-primary text-[13px] !py-2.5 !px-5 flex items-center gap-2 whitespace-nowrap">
              <Plus size={16} />
              Add Entry
            </button>
          )}
        </div>

        {/* Timeline / List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-black/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="relative">
            {entries.map((entry) => {
              const colors = TYPE_COLORS[entry.type] || TYPE_COLORS.other
              return (
                <div
                  key={entry._id}
                  className={`relative pl-8 pb-8 border-l-2 ${colors.accent} last:border-l-transparent last:pb-0`}
                >
                  {/* Timeline dot */}
                  <span
                    className={`absolute left-[-7px] top-2 w-3.5 h-3.5 rounded-full border-2 border-white ${colors.dot}`}
                  />

                  {/* Entry card */}
                  <div className="border border-hairline bg-white rounded-2xl p-5 md:p-6 shadow-card hover:shadow-lg transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {entry.type || 'Other'}
                        </span>
                        <span className="font-sans text-[13px] text-body-muted font-medium">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-display text-[18px] md:text-[20px] font-bold text-ink mb-1.5 leading-snug">
                      {entry.title}
                    </h3>
                    {entry.description && (
                      <p className="font-sans text-[14px] text-body-muted leading-relaxed">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="border border-hairline bg-white rounded-2xl p-12 text-center">
            <CalendarDays size={40} className="mx-auto text-body-muted mb-3" />
            <p className="font-sans text-[15px] text-body-muted">
              No calendar entries found for the selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
