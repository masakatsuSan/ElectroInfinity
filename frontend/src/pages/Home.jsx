import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAnnouncements } from '../api/announcements'
import SEO from '../components/SEO'

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ['announcements', { limit: 4 }],
    queryFn: () => getAnnouncements({ limit: 4 }).then(r => r.data),
  })

  const announcements = data?.data || []

  return (
    <div className="bg-white text-ink">
      <SEO
        title="Home"
        description="Electro Infinity — Electrical Engineering Club, Alipurduar Government Engineering and Management College"
        path="/"
      />

      {/* Hero Band */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="max-w-[880px]">
            <div className="mb-8">
              <span className="inline-block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
                Electrical Engineering Club · AGEMC
              </span>
            </div>

            <h1 className="font-display text-[40px] sm:text-[56px] lg:text-[72px] font-normal leading-[1.08] text-ink mb-8">
              Where engineering curiosity turns into real power.
            </h1>

            <p className="font-sans text-[17px] sm:text-[20px] font-normal leading-[1.4] text-body max-w-2xl mb-12">
              The official hub for circuit design, power systems, hands-on automation labs, and peer-to-peer engineering research at AGEMC.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/courses" className="button-primary font-sans">
                Explore Courses →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Signature Card */}
      <section className="pb-24 md:pb-24">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="hero-card-dark min-h-[360px] md:min-h-[420px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-signature-mint animate-pulse" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16px] text-signature-mint">
                    Live Department Platform
                  </span>
                </div>
                <span className="font-mono text-[12px] font-normal text-white/70">
                  v2.4.0-stable
                </span>
              </div>

              <h3 className="font-display text-[26px] md:text-[34px] font-normal leading-[1.2] text-white mb-4">
                Academic Management & Department Hub
              </h3>
              <p className="font-sans text-[15px] font-normal leading-[1.4] text-white/80 max-w-xl">
                Real-time academic resource management, department announcements, and student-faculty collaboration tools.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap gap-4 text-white items-center text-[13px] font-sans font-normal">
              <span className="flex items-center gap-2"><Check size={14} />Faculty-Led Workshops</span>
              <span className="flex items-center gap-2"><Check size={14} />Research Collaboration</span>
              <span className="flex items-center gap-2"><Check size={14} />Industry-Aligned Projects</span>
            </div>
          </div>
        </div>
      </section>

      {/* Coral Signature Card */}
      <section className="pb-24 md:pb-24">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="signature-coral-card">
            <div className="max-w-3xl">
              <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-cream mb-4">
                Academic Focus
              </span>
              <h2 className="font-display text-[32px] md:text-[40px] font-normal leading-[1.2] text-white mb-6">
                Theory to Lab Prototype
              </h2>
              <p className="font-sans text-[15px] font-normal leading-[1.4] text-white/85 max-w-xl mb-8">
                Power Electronics, Digital Signal Processing, Renewable Energy Systems, and Microcontrollers.
              </p>
              <Link to="/laboratory" className="button-secondary-on-dark font-sans">
                View Laboratory Facilities →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="pb-24 md:pb-32 bg-signature-forest">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="max-w-3xl mb-16">
            <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-mint mb-4">
              Core Pillars
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] font-normal leading-[1.2] text-white">
              Built for engineering rigor, practical mastery, and research collaboration.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white md:col-span-2 md:row-span-2 min-h-[360px] flex flex-col justify-between p-8 md:p-10 border border-divider-soft shadow-sm">
              <div>
                <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-forest mb-5">
                  01. WORKSHOPS
                </span>
                <h3 className="font-display text-[20px] font-normal leading-[1.35] text-ink mb-3">
                  Hands-on Hardware
                </h3>
                <p className="font-sans text-[14px] font-normal leading-[1.4] text-body">
                  Practical sessions on PCB design, embedded systems, transformer testing, and power grid simulation.
                </p>
              </div>
              <span className="mt-8 block h-12 w-12 rounded-lg bg-signature-yellow" />
            </div>

            <div className="bg-[#f2f1ee] min-h-[180px] flex flex-col justify-between p-6 md:p-8 border border-divider-soft shadow-sm">
              <div>
                <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-ink mb-5">
                  02. CAREER
                </span>
                <h3 className="font-display text-[20px] font-normal leading-[1.35] text-ink mb-3">
                  Placement & Alumni
                </h3>
                <p className="font-sans text-[14px] font-normal leading-[1.4] text-body">
                  Direct mentorship from alumni in core electrical, semiconductor, and automation industries.
                </p>
              </div>
              <span className="block h-10 w-10 rounded-lg bg-ink" />
            </div>

            <div className="bg-white min-h-[180px] flex flex-col justify-between p-6 md:p-8 border border-divider-soft shadow-sm">
              <div>
                <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral mb-5">
                  03. RESEARCH
                </span>
                <h3 className="font-display text-[20px] font-normal leading-[1.35] text-ink mb-3">
                  Research & Innovation
                </h3>
                <p className="font-sans text-[14px] font-normal leading-[1.4] text-body">
                  Faculty-guided research in power systems, renewable energy, and embedded intelligence.
                </p>
              </div>
              <span className="block h-10 w-10 rounded-lg bg-signature-coral" />
            </div>

            <div className="bg-[#f2f1ee] md:col-span-2 min-h-[180px] flex flex-col justify-between p-6 md:p-8 border border-divider-soft shadow-sm">
              <div>
                <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-ink mb-5">
                  04. LABS
                </span>
                <h3 className="font-display text-[20px] font-normal leading-[1.35] text-ink mb-3">
                  Instrumentation & Automation
                </h3>
                <p className="font-sans text-[14px] font-normal leading-[1.4] text-body">
                  Calibrated lab benches, digital oscilloscopes, relay test kits, and PLC trainers for every semester.
                </p>
              </div>
              <span className="block h-10 w-10 rounded-lg bg-signature-forest" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats + Manifesto */}
      <section className="py-24 md:py-24 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral mb-4">
                By the numbers
              </span>
              <h2 className="font-display text-[32px] md:text-[40px] font-normal leading-[1.2] text-ink mb-6">
                A community built on measurable impact.
              </h2>
              <p className="font-sans text-[15px] font-normal leading-[1.5] text-body max-w-md">
                We track workshops, projects, placements, and research output so every student can see the return on their effort.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 border border-divider-soft bg-surface-soft">
                <span className="block font-display text-[36px] md:text-[44px] font-normal leading-none text-ink">50+</span>
                <span className="block mt-2 font-sans text-[14px] text-body">Workshops delivered</span>
              </div>
              <div className="p-6 border border-divider-soft bg-surface-soft">
                <span className="block font-display text-[36px] md:text-[44px] font-normal leading-none text-ink">120+</span>
                <span className="block mt-2 font-sans text-[14px] text-body">Student projects</span>
              </div>
              <div className="p-6 border border-divider-soft bg-surface-soft">
                <span className="block font-display text-[36px] md:text-[44px] font-normal leading-none text-ink">85%</span>
                <span className="block mt-2 font-sans text-[14px] text-body">Placement readiness</span>
              </div>
              <div className="p-6 border border-divider-soft bg-surface-soft">
                <span className="block font-display text-[36px] md:text-[44px] font-normal leading-none text-ink">30+</span>
                <span className="block mt-2 font-sans text-[14px] text-body">Alumni mentors</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="py-24 md:py-24 bg-signature-cream">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="flex flex-col justify-between gap-6 pb-8 mb-12 border-b border-hairline sm:flex-row sm:items-end">
            <div>
              <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral mb-3">
                Official Communications
              </span>
              <h2 className="font-display text-[32px] md:text-[40px] font-normal leading-[1.2] text-ink">
                Latest Announcements
              </h2>
            </div>
            <Link to="/announcements" className="button-secondary font-sans text-[14px]">
              View All Announcements →
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-hairline bg-white">
            {isLoading ? (
              <div className="divide-y divide-hairline">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col justify-between gap-4 p-6 border-b border-hairline last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-5 rounded bg-surface-soft animate-pulse" />
                      <div className="w-48 h-4 rounded bg-surface-soft animate-pulse" />
                    </div>
                    <div className="w-24 h-4 rounded bg-surface-soft animate-pulse" />
                  </div>
                ))}
              </div>
            ) : announcements.length > 0 ? (
              <div className="divide-y divide-hairline">
                {announcements.map(a => (
                  <div key={a._id} className="flex flex-col justify-between gap-4 p-6 transition-colors sm:flex-row sm:items-center hover:bg-surface-soft">
                    <div className="flex items-center min-w-0 gap-4">
                      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16px] px-3 py-1 rounded-md bg-signature-mint text-signature-forest border border-signature-mint flex-shrink-0">
                        {a.category || 'general'}
                      </span>
                      <h3 className="font-sans text-[16px] font-medium text-ink truncate">{a.title}</h3>
                    </div>

                    <div className="flex items-center flex-shrink-0 gap-4">
                      <span className="font-mono text-[12px] font-normal text-muted">
                        {new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <Link to="/announcements" className="text-[13px] font-sans font-medium text-link hover:underline">
                        Read →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted font-sans font-normal">No announcements published yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
