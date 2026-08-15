import { useQuery } from '@tanstack/react-query'
import { getPlacements } from '../api/placements'
import SEO from '../components/SEO'

export default function Placements() {
  const { data: allData, isLoading } = useQuery({
    queryKey: ['placements'],
    queryFn: () => getPlacements().then(r => r.data),
  })

  const placements = allData?.data || []
  const STATS = placements.filter(p => p.type === 'stat').map(p => ({ n: p.statValue, l: p.statLabel }))
  const RECRUITERS = placements.filter(p => p.type === 'recruiter').map(p => ({ name: p.companyName, role: p.roleOffered, placed: p.studentsPlaced }))
  const INTERNSHIPS = placements.filter(p => p.type === 'internship').map(p => ({ title: p.internshipTitle, company: p.internshipCompany, stipend: p.stipend, deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '' }))
  const ALUMNI = placements.filter(p => p.type === 'alumni').map(p => ({ initials: p.alumniInitials, name: p.alumniName, role: p.alumniRole, desc: p.alumniDesc, batch: p.alumniBatch }))

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Placements & Career | Electro Infinity"
        description="Career opportunities, core recruiter networks, internships and alumni profiles of AGEMC EE."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Career & Industry
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Placements & Careers
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            From AGEMC laboratory workbenches to core power grids, automation EPCs, semiconductors, and technology leaders.
          </p>
        </div>

        {/* Stats Grid */}
        {STATS.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-16">
            {STATS.map(s => (
              <div key={s.l} className="border border-hairline bg-soft-stone rounded-2xl p-8 text-center shadow-card">
                <div className="font-display font-bold text-[44px] text-ink leading-none mb-2">{s.n}</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-slate font-semibold">{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recruiters */}
        <div className="mb-16">
          <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-deep-green block mb-2">
            Top Recruiters
          </span>
          <h2 className="font-display text-[26px] font-bold text-ink mb-6">Partner Companies</h2>

          <div className="border border-hairline bg-canvas rounded-2xl overflow-hidden shadow-card divide-y divide-hairline">
            {RECRUITERS.length > 0 ? (
              RECRUITERS.map(r => (
                <div key={r.name} className="p-5 md:p-6 flex items-center justify-between gap-4 hover:bg-soft-stone/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-soft-stone border border-hairline flex items-center justify-center font-display font-bold text-ink text-[14px]">
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-sans text-[16px] font-semibold text-ink">{r.name}</h3>
                      <p className="font-sans text-[13px] text-body-muted">{r.role}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[12px] font-bold uppercase px-3 py-1 rounded-md bg-pale-green text-deep-green border border-green-200">
                    {r.placed} Placed
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-body-muted font-sans text-[14px]">Recruiter statistics update periodically.</div>
            )}
          </div>
        </div>

        {/* Internships */}
        {INTERNSHIPS.length > 0 && (
          <div className="mb-16">
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-coral block mb-2">
              Opportunities
            </span>
            <h2 className="font-display text-[26px] font-bold text-ink mb-6">Current Internships</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {INTERNSHIPS.map(i => (
                <div key={i.title} className="border border-hairline bg-canvas rounded-2xl p-6 shadow-card flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-[18px] font-bold text-ink mb-1">{i.title}</h3>
                    <p className="font-sans text-[14px] text-body-muted mb-4">{i.company}</p>
                    <p className="font-mono text-[12px] text-deep-green font-semibold">{i.stipend} · Deadline: {i.deadline}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-hairline">
                    <a href="#" className="button-pill-outline text-[13px]">
                      Apply Now →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alumni */}
        {ALUMNI.length > 0 && (
          <div>
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-slate block mb-2">
              Alumni Network
            </span>
            <h2 className="font-display text-[26px] font-bold text-ink mb-6">Alumni Spotlights</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {ALUMNI.map(a => (
                <div key={a.name} className="border border-hairline bg-canvas rounded-2xl p-6 shadow-card flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-soft-stone border border-hairline flex items-center justify-center font-display font-bold text-ink text-[14px] flex-shrink-0">
                    {a.initials}
                  </div>
                  <div>
                    <h3 className="font-display text-[17px] font-bold text-ink">{a.name}</h3>
                    <p className="font-sans text-[13px] text-body-muted mt-0.5">{a.role}</p>
                    <p className="font-sans text-[14px] text-ink mt-2 leading-relaxed">{a.desc}</p>
                    <span className="font-mono text-[11px] text-coral font-bold uppercase tracking-wider block mt-3">Batch {a.batch}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
