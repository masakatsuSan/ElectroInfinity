import { useQuery } from '@tanstack/react-query'
import { getEvents } from '../api/events'

export default function Events() {
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents().then(r => r.data),
  })

  const all       = data?.data || []
  const upcoming  = all.filter(e => new Date(e.date) > new Date())
  const past      = all.filter(e => new Date(e.date) <= new Date())

  const typeLabel = {
    workshop: 'Workshop', seminar: 'Seminar',
    fest: 'Technical Fest', activity: 'Activity', other: 'Event',
  }

  return (
    <div className="container pt-32 pb-20 min-h-screen bg-canvas text-ink">
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        What's Happening
      </h2>
      <h1 className="font-display font-semibold text-[clamp(40px,8vw,64px)] leading-tight tracking-normal mb-12 text-ink">
        Events
      </h1>

      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          {/* Upcoming */}
          <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-4">
            ↗ Upcoming
          </h2>
          <div className="flex flex-col border-t border-divider-soft mb-16">
            {upcoming.length > 0
              ? upcoming.map(e => <EventRow key={e._id} event={e} typeLabel={typeLabel} upcoming />)
              : <p className="font-sans text-[17px] text-ink-muted-80 py-8 border-b border-divider-soft">No upcoming events right now.</p>}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-4">
                Archive
              </h2>
              <div className="flex flex-col border-t border-divider-soft">
                {past.map(e => <EventRow key={e._id} event={e} typeLabel={typeLabel} />)}
              </div>
            </div>
          )}

          {all.length === 0 && (
            <p className="font-sans text-[17px] text-ink-muted-80 py-16 text-center border-y border-divider-soft">
              No events added yet. Admin can add events from the admin panel.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function EventRow({ event: e, typeLabel, upcoming }) {
  const d = new Date(e.date)
  const day   = d.toLocaleDateString('en-IN', { day: '2-digit' })
  const month = d.toLocaleDateString('en-IN', { month: 'short' })
  const year  = d.getFullYear()

  return (
    <div className={`grid grid-cols-[80px_1fr] sm:grid-cols-[120px_1fr] gap-6 py-8 border-b border-divider-soft group ${!upcoming ? 'opacity-60 grayscale' : ''}`}>
      {/* Date block */}
      <div className="flex flex-col items-start pt-1">
        <div className="font-display font-medium text-[40px] text-primary leading-none mb-1">{day}</div>
        <div className="font-sans text-[12px] font-semibold text-ink-muted-48 uppercase tracking-widest">{month} {year}</div>
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h3 className="font-display font-semibold text-[24px] tracking-tight text-ink leading-snug">
            {e.title}
          </h3>
          <span className="font-sans text-[12px] font-medium uppercase tracking-widest text-primary border border-primary/20 bg-primary/5 px-2.5 py-1 rounded">
            {typeLabel[e.type] || 'Event'}
          </span>
        </div>
        {e.venue && (
          <p className="font-sans text-[12px] font-semibold text-ink-muted-48 uppercase tracking-widest mb-3">{e.venue}</p>
        )}
        {e.description && (
          <p className="font-sans text-[17px] font-normal text-ink-muted-80 leading-relaxed max-w-[700px] mb-4">{e.description}</p>
        )}
        {upcoming && e.registrationLink && (
          <a
            href={e.registrationLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-sans text-[14px] font-medium text-link hover:text-primary transition-colors"
          >
            Register →
          </a>
        )}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col border-t border-divider-soft">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-8 py-8 border-b border-divider-soft animate-pulse">
          <div className="w-24 space-y-2">
            <div className="h-10 bg-surface-pearl rounded w-12" />
            <div className="h-4 bg-surface-pearl rounded w-16" />
          </div>
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-6 bg-surface-pearl rounded w-64" />
            <div className="h-4 bg-surface-pearl rounded w-40" />
            <div className="h-4 bg-surface-pearl rounded max-w-[700px]" />
          </div>
        </div>
      ))}
    </div>
  )
}
