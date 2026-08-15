import { useQuery } from '@tanstack/react-query'
import { getEvents } from '../api/events'
import SEO from '../components/SEO'

export default function Events() {
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents().then(r => r.data),
  })

  const all      = data?.data || []
  const upcoming = all.filter(e => new Date(e.date) > new Date())
  const past     = all.filter(e => new Date(e.date) <= new Date())

  const typeLabel = {
    workshop: 'Workshop', seminar: 'Seminar',
    fest: 'Technical Fest', activity: 'Activity', other: 'Department Event',
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO title="Events & Workshops | Electro Infinity" description="Upcoming and past events from the Electro Infinity community." />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Schedule & Workshops
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Department Events
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Practical hardware workshops, simulation bootcamps, technical fests, and expert guest lectures at AGEMC.
          </p>
        </div>

        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <>
            {/* Upcoming */}
            <div className="mb-16">
              <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-deep-green block mb-6">
                Upcoming Sessions
              </span>
              {upcoming.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {upcoming.map(e => (
                    <EventCard key={e._id} event={e} typeLabel={typeLabel} isUpcoming />
                  ))}
                </div>
              ) : (
                <div className="border border-hairline bg-soft-stone rounded-2xl p-12 text-center">
                  <p className="font-sans text-[15px] text-body-muted">No upcoming events scheduled right now. Check back soon!</p>
                </div>
              )}
            </div>

            {/* Archive */}
            {past.length > 0 && (
              <div>
                <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-slate block mb-6">
                  Past Archives
                </span>
                <div className="grid md:grid-cols-2 gap-6">
                  {past.map(e => (
                    <EventCard key={e._id} event={e} typeLabel={typeLabel} isUpcoming={false} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EventCard({ event: e, typeLabel, isUpcoming }) {
  const d     = new Date(e.date)
  const day   = d.toLocaleDateString('en-IN', { day: '2-digit' })
  const month = d.toLocaleDateString('en-IN', { month: 'short' })
  const year  = d.getFullYear()

  return (
    <div
      className={`border border-hairline rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-card transition-all ${
        isUpcoming ? 'bg-canvas hover:bg-soft-stone/30' : 'bg-soft-stone/50 opacity-80'
      }`}
    >
      <div>
        {/* Date + badge */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[38px] font-bold text-ink leading-none">{day}</span>
            <span className="font-mono text-[13px] text-slate uppercase tracking-wider font-semibold">
              {month} {year}
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-pale-green text-deep-green border border-green-200">
            {typeLabel[e.type] || 'Event'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-[20px] font-bold text-ink mb-2 leading-snug">
          {e.title}
        </h3>

        {/* Venue */}
        {e.venue && (
          <p className="font-mono text-[12px] text-slate mb-3">
            📍 {e.venue}
          </p>
        )}

        {/* Description */}
        {e.description && (
          <p className="font-sans text-[14px] text-body-muted leading-relaxed mb-6">
            {e.description}
          </p>
        )}
      </div>

      {/* Register link */}
      {isUpcoming && e.registrationLink && (
        <div className="pt-4 border-t border-hairline">
          <a
            href={e.registrationLink}
            target="_blank"
            rel="noreferrer"
            className="button-primary !py-2 !px-4 !text-[13px]"
          >
            Register for Workshop →
          </a>
        </div>
      )}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-hairline bg-soft-stone/40 rounded-2xl h-[200px] animate-pulse" />
      ))}
    </div>
  )
}
