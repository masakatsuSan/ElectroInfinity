import { useQuery } from '@tanstack/react-query'
import { getFaculty } from '../api/faculty'

export default function Faculty() {
  const { data, isLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => getFaculty().then(r => r.data),
  })

  const faculty = data?.data || []

  return (
    <div className="container pt-32 pb-20 bg-canvas text-ink min-h-screen">
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        Our People
      </h2>
      <h1 className="font-display font-semibold text-[clamp(40px,8vw,64px)] leading-tight tracking-normal mb-12 text-ink">
        Faculty
      </h1>

      <div className="flex flex-col border-t border-divider-soft">
        {faculty.length > 0
          ? faculty.map(f => <FacultyRow key={f._id} faculty={f} />)
          : (
            <div className="py-16 text-center border-b border-divider-soft">
              <p className="font-sans text-[17px] text-ink-muted-80">No faculty profiles added yet.</p>
            </div>
          )}
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
    <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-6 py-8 border-b border-divider-soft items-start group">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full bg-surface-pearl flex items-center justify-center flex-shrink-0 overflow-hidden border border-divider-soft">
        {f.photo ? (
          <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display font-medium text-[20px] text-ink">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center min-h-[64px]">
        <h3 className="font-display font-semibold text-[21px] text-ink tracking-tight mb-1">{f.name}</h3>
        <p className="font-sans text-[14px] font-semibold uppercase tracking-widest text-primary mb-2">
          {f.designation}
          {f.isHOD && <span className="ml-2 text-green-500">· HOD</span>}
        </p>
        <p className="font-sans text-[14px] text-ink-muted-80 leading-relaxed max-w-[600px]">
          {f.specialization && <>{f.specialization} <span className="mx-1 opacity-50">·</span> </>}
          {f.qualification}
        </p>
      </div>

      {/* Email */}
      {f.email && (
        <a
          href={`mailto:${f.email}`}
          className="font-sans text-[14px] font-medium text-link hover:text-primary transition-colors sm:self-center col-span-2 sm:col-span-1 mt-2 sm:mt-0"
        >
          {f.email}
        </a>
      )}
    </div>
  )
}
