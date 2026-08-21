import { useQuery } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { getFaculty } from '../api/faculty'
import SEO from '../components/SEO'

export default function Faculty() {
  const { data, isLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => getFaculty().then(r => r.data),
  })

  const faculty = data?.data || []

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Faculty Directory | Electro Infinity"
        description="Distinguished faculty members and researchers of Electrical Engineering at AGEMC."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Academic Leadership
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Faculty & Researchers
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Professors guiding undergraduate coursework, state-of-the-art power labs, and embedded systems engineering.
          </p>
        </div>

        {/* Directory (Rule-separated research layout) */}
        <div className="border border-hairline bg-canvas rounded-2xl overflow-hidden shadow-card divide-y divide-hairline">
          {isLoading ? (
            <div className="p-12 text-center text-slate">Loading faculty directory…</div>
          ) : faculty.length > 0 ? (
            faculty.map(f => <FacultyRow key={f._id} faculty={f} />)
          ) : (
            <div className="p-16 text-center text-body-muted">
              <p className="font-sans text-[16px]">No faculty profiles listed currently.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FacultyRow({ faculty: f }) {
  const initials = f.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-soft-stone/30 transition-colors">
      <div className="flex items-center gap-5 min-w-0">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-22px bg-soft-stone flex items-center justify-center flex-shrink-0 overflow-hidden border border-hairline shadow-sm">
          {f.photo ? (
            <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-bold text-[20px] text-ink">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-[20px] text-ink">{f.name}</h3>
            {f.isHOD && (
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-deep-green text-white">
                HOD
              </span>
            )}
          </div>
          <p className="font-mono text-[12px] uppercase tracking-wider text-slate font-medium mb-1">
            {f.designation}
          </p>
          <p className="font-sans text-[14px] text-body-muted leading-relaxed">
            {f.specialization && <span className="font-medium text-ink">{f.specialization} · </span>}
            {f.qualification}
          </p>
        </div>
      </div>

      {/* Email button */}
      {f.email && (
        <a
          href={`mailto:${f.email}`}
          className="button-pill-outline text-[13px] self-start sm:self-center flex-shrink-0"
        >
          <Mail size={14} /> {f.email}
        </a>
      )}
    </div>
  )
}
