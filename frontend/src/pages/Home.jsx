import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAnnouncements } from '../api/announcements'
import SEO from '../components/SEO'
import ScrollReveal from '../components/ScrollReveal'

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ['announcements', { limit: 4 }],
    queryFn: () => getAnnouncements({ limit: 4 }).then(r => r.data),
  })

  const announcements = data?.data || []

  return (
    <div className="min-h-screen bg-white text-ink">
      <SEO
        title="Home"
        description="Electro Infinity — Electrical Engineering Club, Alipurduar Government Engineering and Management College"
        path="/"
      />

      <section className="pt-24 pb-16 md:pt-32 md:pb-24" view-transition-name="hero-section">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="max-w-[880px]">
            <ScrollReveal variant="fadeUp">
              <div className="mb-8">
                <span className="inline-block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
                  Electrical Engineering Club · AGEMC
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={0.1}>
              <h1 className="font-display text-[40px] sm:text-[56px] lg:text-[72px] font-normal leading-[1.08] text-ink mb-8">
                Where engineering curiosity turns into real power.
              </h1>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={0.2}>
              <p className="font-sans text-[17px] sm:text-[20px] font-normal leading-[1.4] text-body max-w-2xl mb-12">
                The official hub for circuit design, power systems, hands-on automation labs, and peer-to-peer engineering research at AGEMC.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={0.3}>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/courses" className="font-sans button-primary">
                  Explore Courses →
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <ScrollReveal variant="fadeUp">
        <section className="pb-24 md:pb-24" view-transition-name="hero-dark-card">
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
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="pb-24 md:pb-24" view-transition-name="hero-coral-card">
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
                <Link to="/laboratory" className="font-sans button-secondary-on-dark">
                  View Laboratory Facilities →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="relative overflow-hidden py-28 md:py-36 bg-signature-forest" view-transition-name="hero-bento-section">
          <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:22px_22px]" />
          <div className="absolute border rounded-full -top-24 -left-24 w-80 h-80 border-white/5" />
          <div className="absolute border rounded-full top-1/3 -right-20 w-72 h-72 border-white/5" />

          <div className="mx-auto max-w-[1280px] px-6 md:px-12 relative">
            <ScrollReveal variant="fadeUp">
              <div className="max-w-3xl mb-16">
                <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-mint mb-4">
                  Core Pillars
                </span>
                <h2 className="font-display text-[32px] md:text-[40px] font-normal leading-[1.2] text-white">
                  Built for engineering rigor, practical mastery, and research collaboration.
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-5 md:auto-rows-[180px] lg:grid-cols-4">
              <ScrollReveal variant="scaleIn" delay={0}>
                <article className="bento-card col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-2 bg-white rounded-[22px] p-6 md:p-8 lg:p-10 border border-white/70 shadow-card flex flex-col justify-between relative overflow-hidden" view-transition-name="bento-card-1">
                  <div className="absolute top-0 right-0 -translate-y-1/2 rounded-full w-44 h-44 bg-signature-yellow/20 blur-3xl translate-x-1/4" />
                  <div className="hidden md:absolute md:top-4 md:right-6 font-display text-[140px] font-normal leading-none text-ink/4 select-none">
                    01
                  </div>
                  <div className="relative">
                    <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-forest mb-5">
                      01. WORKSHOPS
                    </span>
                    <h3 className="font-display text-[26px] md:text-[32px] font-normal leading-[1.2] text-ink mb-4">
                      Hands-on Hardware
                    </h3>
                    <p className="font-sans text-[15px] font-normal leading-[1.5] text-body max-w-sm">
                      Practical sessions on PCB design, embedded systems, transformer testing, and power grid simulation.
                    </p>
                  </div>
                  <div className="relative flex items-end justify-between" />
                </article>
              </ScrollReveal>

              <ScrollReveal variant="scaleIn" delay={0.1}>
                <article className="bento-card col-span-1 md:col-span-1 lg:col-span-1 bg-[#f2f1ee] rounded-[22px] p-6 md:p-7 lg:p-8 border border-white/60 shadow-card flex flex-col justify-between relative overflow-hidden" view-transition-name="bento-card-2">
                  <div className="absolute top-0 right-0 w-32 h-32 -translate-y-1/2 rounded-full bg-ink/5 blur-2xl translate-x-1/3" />
                  <div className="relative">
                    <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-ink mb-4">
                      02. CAREER
                    </span>
                    <h3 className="font-display text-[22px] font-normal leading-[1.3] text-ink mb-3">
                      Placement & Alumni
                    </h3>
                    <p className="font-sans text-[14px] font-normal leading-[1.45] text-body">
                      Direct mentorship from alumni in core electrical, semiconductor, and automation industries.
                    </p>
                  </div>
                  <div className="relative flex items-end justify-between" />
                </article>
              </ScrollReveal>

              <ScrollReveal variant="scaleIn" delay={0.2}>
                <article className="bento-card col-span-1 md:col-span-1 lg:col-span-1 bg-white rounded-[22px] p-6 md:p-7 lg:p-8 border border-white/70 shadow-card flex flex-col justify-between relative overflow-hidden" view-transition-name="bento-card-3">
                  <div className="absolute top-0 right-0 w-32 h-32 -translate-y-1/2 rounded-full bg-signature-coral/15 blur-2xl translate-x-1/3" />
                  <div className="relative">
                    <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral mb-4">
                      03. RESEARCH
                    </span>
                    <h3 className="font-display text-[22px] font-normal leading-[1.3] text-ink mb-3">
                      Research & Innovation
                    </h3>
                    <p className="font-sans text-[14px] font-normal leading-[1.45] text-body">
                      Faculty-guided research in power systems, renewable energy, and embedded intelligence.
                    </p>
                  </div>
                  <div className="relative flex items-end justify-between" />
                </article>
              </ScrollReveal>

              <ScrollReveal variant="scaleIn" delay={0.3}>
                <article className="bento-card col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-2 bg-white rounded-[22px] p-7 md:p-8 lg:p-10 border border-white/10 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden" view-transition-name="bento-card-4">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(168,216,196,0.14),transparent_55%)]" />
                  <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:18px_18px]" />
                  <div className="relative">
                    <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-mint mb-4">
                      04. LABS
                    </span>
                    <h3 className="font-display text-[26px] md:text-[32px] font-normal leading-[1.2] text-black mb-3">
                      Instrumentation & Automation
                    </h3>
                    <p className="font-sans text-[15px] font-normal leading-[1.5] text-black/70 max-w-2xl">
                      Calibrated lab benches, digital oscilloscopes, relay test kits, and PLC trainers for every semester.
                    </p>
                  </div>
                  <div className="relative flex items-end justify-between gap-6 md:justify-end" />
                </article>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="py-24 bg-white md:py-24" view-transition-name="hero-stats">
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
                  <span className="block font-display text-[36px] md:text-[44px] font-normal leading-none text-ink">5+</span>
                  <span className="block mt-2 font-sans text-[14px] text-body">Workshops delivered</span>
                </div>
                <div className="p-6 border border-divider-soft bg-surface-soft">
                  <span className="block font-display text-[36px] md:text-[44px] font-normal leading-none text-ink">20+</span>
                  <span className="block mt-2 font-sans text-[14px] text-body">Student projects</span>
                </div>
                <div className="p-6 border border-divider-soft bg-surface-soft">
                  <span className="block font-display text-[36px] md:text-[44px] font-normal leading-none text-ink">85%</span>
                  <span className="block mt-2 font-sans text-[14px] text-body">Placement readiness</span>
                </div>
                <div className="p-6 border border-divider-soft bg-surface-soft">
                  <span className="block font-display text-[36px] md:text-[44px] font-normal leading-none text-ink">10+</span>
                  <span className="block mt-2 font-sans text-[14px] text-body">Alumni mentors</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="py-24 md:py-24 bg-signature-cream" view-transition-name="hero-announcements">
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

            <div className="overflow-hidden bg-white border rounded-lg border-hairline">
              {isLoading ? (
                <div className="divide-y divide-hairline">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col justify-between gap-4 p-6 border-b border-hairline last:border-b-0">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-5 rounded bg-surface-soft skeleton-shimmer" />
                        <div className="w-48 h-4 rounded bg-surface-soft skeleton-shimmer" />
                      </div>
                      <div className="w-24 h-4 rounded bg-surface-soft skeleton-shimmer" />
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
                        <Link to="/announcements" className="text-[13px] font-sans font-medium text-link no-underline hover:no-underline">
                          Read →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 font-sans font-normal text-center text-muted">No announcements published yet.</div>
              )}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
