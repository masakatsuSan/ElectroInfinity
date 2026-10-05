import { useQuery } from '@tanstack/react-query'
import {
  getPlacementStats,
  getRecruiters,
  getPlacedStudents,
  getAlumni,
} from '../api/placements'
import SEO from '../components/SEO'
import { BRAND_NAME } from '../config/brand'
import { Skeleton } from '../components/Skeleton'

function initials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function fmtNum(n) {
  if (n === undefined || n === null || n === '') return '—'
  return String(n)
}

export default function Placements() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['placements', 'stats'],
    queryFn: () => getPlacementStats().then(r => r.data),
  })

  const { data: recruitersData, isLoading: recruitersLoading } = useQuery({
    queryKey: ['placements', 'recruiters'],
    queryFn: () => getRecruiters().then(r => r.data),
  })

  const { data: internshipsData, isLoading: internshipsLoading } = useQuery({
    queryKey: ['placements', 'internships'],
    queryFn: () => getPlacedStudents({ type: 'internship' }).then(r => r.data),
  })

  const { data: alumniData, isLoading: alumniLoading } = useQuery({
    queryKey: ['placements', 'alumni'],
    queryFn: () => getAlumni().then(r => r.data),
  })

  const loading = statsLoading || recruitersLoading || internshipsLoading || alumniLoading

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-ink pt-24 md:pt-32 pb-24">
        <SEO title={`Placements &amp; Career | ${BRAND_NAME}`} />
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="mb-14 max-w-3xl">
            <div className="mb-2 h-4 w-24 rounded bg-surface-soft skeleton-shimmer" />
            <div className="mb-4 h-12 w-64 rounded bg-surface-soft skeleton-shimmer" />
            <div className="h-5 w-96 rounded bg-surface-soft skeleton-shimmer" />
          </div>
          <div className="mb-16 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-hairline bg-white rounded-lg p-8 text-center skeleton-shimmer">
                <div className="mx-auto mb-2 h-12 w-16 rounded bg-surface-soft" />
                <div className="mx-auto h-3 w-20 rounded bg-surface-soft" />
              </div>
            ))}
          </div>
          <div className="mb-16">
            <div className="mb-2 h-4 w-28 rounded bg-surface-soft skeleton-shimmer" />
            <div className="mb-6 h-7 w-48 rounded bg-surface-soft skeleton-shimmer" />
            <div className="border border-hairline bg-white rounded-lg overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-5 skeleton-shimmer md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-surface-soft h-12 w-12" />
                    <div>
                      <div className="mb-1 h-4 w-32 rounded bg-surface-soft" />
                      <div className="h-3 w-24 rounded bg-surface-soft" />
                    </div>
                  </div>
                  <div className="h-6 w-16 rounded bg-surface-soft" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = statsData?.data || []
  const recruiters = recruitersData?.data || []
  const internships = internshipsData?.data || []
  const alumni = alumniData?.data || []

  // Each PlacementStat record contributes multiple stat cards
  const STATS = []
  for (const s of stats) {
    if (s.highestPackage) STATS.push({ n: s.highestPackage, l: 'Highest Package' })
    if (s.averagePackage) STATS.push({ n: s.averagePackage, l: 'Average Package' })
    if (s.medianPackage) STATS.push({ n: s.medianPackage, l: 'Median Package' })
    if (s.totalStudents) STATS.push({ n: s.totalStudents, l: `Total Students (${s.academicYear})` })
    if (s.placed) STATS.push({ n: s.placed, l: `Placed (${s.academicYear})` })
  }

  const RECRUITERS = recruiters.map(r => ({
    name: r.name,
    logoUrl: r.logoUrl,
    role: r.type === 'both' ? 'Placements & Internships' : r.type === 'placement' ? 'Placements' : 'Internships',
    placed: '—',
  }))

  const INTERNSHIPS = internships.map(i => ({
    title: i.studentName || i.company,
    company: i.company,
    stipend: i.package || '—',
    deadline: '',
    photoUrl: i.photoUrl,
  }))

  const ALUMNI = alumni.map(a => ({
    initials: initials(a.name),
    name: a.name,
    role: a.currentRole,
    desc: a.quote,
    batch: a.batchYear,
    photoUrl: a.photoUrl,
  }))

  return (
    <div className="min-h-screen bg-white text-ink pt-24 md:pt-32">
      <SEO
        title={`Placements &amp; Career | ${BRAND_NAME}`}
        description="Career opportunities, core recruiter networks, internships and alumni profiles of AGEMC EE."
      />

      <div className="mx-auto max-w-[1280px] px-6 md:px-12">
        <section className="pb-24 md:pb-24">
          <div className="max-w-3xl">
            <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
              Career &amp; Industry
            </span>
            <h1 className="mb-5 font-display text-[40px] font-normal leading-[1.15] text-ink md:text-[56px]">
              Placements &amp; Careers
            </h1>
            <p className="max-w-2xl font-sans text-[17px] font-normal leading-[1.4] text-body">
              From AGEMC laboratory workbenches to core power grids, automation EPCs, semiconductors, and technology leaders.
            </p>
          </div>
        </section>

        {STATS.length > 0 && (
          <section className="pb-24 md:pb-24">
            <div className="cream-callout-card grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-8">
              {STATS.map(s => (
                <div key={s.l} className="border border-hairline p-8 text-center md:p-10">
                  <div className="mb-3 font-display text-[44px] font-normal leading-none text-ink">{s.n}</div>
                  <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16px] text-signature-forest">{s.l}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pb-24 md:pb-24">
          <div className="mb-12 max-w-3xl">
            <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-forest">
              Top Recruiters
            </span>
            <h2 className="mb-6 font-display text-[32px] font-normal leading-[1.2] text-ink md:text-[40px]">Partner Companies</h2>
          </div>

          <div className="hero-card-dark overflow-hidden">
            {RECRUITERS.length > 0 ? (
              <div className="divide-y divide-white/20">
                {RECRUITERS.map(r => (
                  <div key={r.name} className="flex items-center justify-between gap-4 p-6 hover:bg-white/5 transition-colors md:p-8">
                    <div className="flex items-center gap-5">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 overflow-hidden">
                        {r.logoUrl ? (
                          <img src={r.logoUrl} alt={r.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="font-sans text-[14px] font-medium text-white">{r.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-sans text-[16px] font-medium text-white">{r.name}</h3>
                        <p className="font-sans text-[13px] font-normal text-white/75">{r.role}</p>
                      </div>
                    </div>
                    <span className="rounded-md border border-signature-mint bg-signature-mint px-3 py-1 font-sans text-[12px] font-medium uppercase tracking-[0.16px] text-signature-forest">
                      {r.placed} Placed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center font-sans text-[14px] font-normal text-white/80">Recruiter statistics update periodically.</div>
            )}
          </div>
        </section>

        {INTERNSHIPS.length > 0 && (
          <section className="pb-24 md:pb-24">
            <div className="mb-12 max-w-3xl">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
                Opportunities
              </span>
              <h2 className="mb-6 font-display text-[32px] font-normal leading-[1.2] text-ink md:text-[40px]">Current Internships</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {INTERNSHIPS.map(i => (
                <div key={i.title} className="border border-hairline bg-white rounded-lg p-6 flex flex-col justify-between md:p-8">
                  <div>
                    <h3 className="mb-1 font-sans text-[18px] font-medium text-ink">{i.title}</h3>
                    <p className="mb-4 font-sans text-[14px] font-normal text-body">{i.company}</p>
                    <p className="font-mono text-[12px] font-medium text-signature-forest">{i.stipend} · Deadline: {i.deadline}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-hairline pt-5">
                    <a href="#" className="button-secondary font-sans text-[13px]">
                      Apply Now →
                    </a>
                    {i.photoUrl ? (
                      <img src={i.photoUrl} alt={i.title} className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <span className="h-8 w-8 rounded-lg bg-signature-yellow" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {ALUMNI.length > 0 && (
          <section className="pb-24 md:pb-24">
            <div className="mb-12 max-w-3xl">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-muted">
                Alumni Network
              </span>
              <h2 className="mb-6 font-display text-[32px] font-normal leading-[1.2] text-ink md:text-[40px]">Alumni Spotlights</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {ALUMNI.map((a, idx) => (
                <div key={a.name} className={'rounded-lg p-6 md:p-8 ' + (Number(a.batch) % 2 === 0 ? 'bg-signature-peach' : 'bg-signature-mint')}>
                  <div className="flex gap-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white overflow-hidden">
                      {a.photoUrl ? (
                        <img src={a.photoUrl} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-sans text-[14px] font-medium text-ink">{a.initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-sans text-[17px] font-medium text-ink">{a.name}</h3>
                      <p className="mt-1 font-sans text-[13px] font-normal text-body">{a.role}</p>
                      <p className="mt-3 font-sans text-[14px] font-normal leading-[1.45] text-ink">{a.desc}</p>
                      <span className="mt-4 block font-mono text-[11px] font-medium uppercase tracking-[0.16px] text-ink">Batch {a.batch}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
