import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'

const TIMELINE = [
  { year: '2023', text: 'Club established by electrical engineering students and faculty mentors at AGEMC.' },
  { year: '2024', text: 'Conducted first hands-on Power Electronics & Hardware Automation workshops for undergraduates.' },
  { year: '2025', text: 'Partnered with department laboratories for guaranteed hardware testbed access.' },
  { year: '2026', text: 'Launched Electro Infinity unified academic resource and community command center.' },
]

const OBJECTIVES = [
  'Run hands-on workshops beyond the syllabus with industry-grade kits.',
  'Guarantee member access to real lab equipment and project testbeds.',
  'Build a strong alumni peer network for internships and core placements.',
  'Make AGEMC EE a beacon of innovation and practical engineering mastery.',
]

const HIGHLIGHTS = [
  { stat: '150+', label: 'Active Student Members', desc: 'Across 4 undergraduate batches' },
  { stat: '12+',  label: 'Workshops & Seminars / Year', desc: 'Hardware & software simulations' },
  { stat: '5',    label: 'Dedicated Laboratories', desc: 'Power, Machines, DSP, Circuits, Drives' },
]

const ACHIEVEMENTS = [
  { year: '2024', title: 'Campus Placements in Core & IT', desc: 'Students secured placements at TCS, core EPC firms, and power automation companies.' },
  { year: '2023', title: 'Smart India Hackathon Finalists', desc: 'Team Electro represented AGEMC at SIH national hardware edition.' },
]

export default function About() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SEO
        title="About Us | Electro Infinity"
        description="Learn more about Electro Infinity, the official Electrical Engineering Club of AGEMC."
        path="/about"
      />

      <ScrollReveal variant="fadeUp">
        <section className="pt-24 md:pt-32 pb-24 md:pb-24" view-transition-name="about-hero">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12">
            <div className="max-w-3xl">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
                The Technical Society
              </span>
              <h1 className="mb-5 font-display text-[40px] font-normal leading-[1.15] text-ink md:text-[56px]">
                About Electro Infinity
              </h1>
              <p className="max-w-2xl font-sans text-[18px] font-normal leading-[1.4] text-body">
                The official student-led technical hub for Electrical Engineering at Alipurduar Government Engineering & Management College.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="py-24 md:py-24" view-transition-name="about-highlights">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12">
            <div className="cream-callout-card grid gap-6 sm:grid-cols-3 md:gap-8">
              {HIGHLIGHTS.map(h => (
                <div
                  key={h.label}
                  className="flex min-h-[220px] flex-col justify-between border border-divider-soft bg-white p-8"
                >
                  <div>
                    <div className="mb-4 font-display text-[44px] font-normal leading-none text-ink">
                      {h.stat}
                    </div>
                    <div className="mb-2 font-display text-[15px] font-medium text-ink">{h.label}</div>
                  </div>
                  <p className="font-sans text-[13px] font-normal leading-[1.4] text-body">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="py-24 md:py-24" view-transition-name="about-objectives">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12">
            <div className="mb-12 max-w-3xl">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-forest">
                Our Mission
              </span>
              <h2 className="mb-4 font-display text-[32px] font-normal leading-[1.2] text-ink md:text-[40px]">
                Core Objectives
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {OBJECTIVES.map((o, i) => (
                <ScrollReveal key={i} variant="fadeUp" delay={i * 0.1}>
                  <div
                    className="border border-divider-soft bg-white p-8 flex gap-5 items-start hover:bg-surface-soft transition-colors"
                  >
                    <span className="font-mono text-[13px] font-medium text-signature-coral flex-shrink-0">
                      0{i + 1}.
                    </span>
                    <p className="font-sans text-[15px] font-normal leading-[1.45] text-ink">{o}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="py-24 md:py-24" view-transition-name="about-timeline">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12">
            <div className="mb-12 max-w-3xl">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-muted">
                History & Milestones
              </span>
              <h2 className="mb-4 font-display text-[32px] font-normal leading-[1.2] text-ink md:text-[40px]">
                Our Journey
              </h2>
            </div>

            <div className="signature-forest-card overflow-hidden">
              {TIMELINE.map((t, i) => (
                <ScrollReveal key={i} variant="fadeUp" delay={i * 0.1}>
                  <div className="flex flex-col gap-5 border-b border-white/20 p-6 last:border-b-0 sm:flex-row sm:items-center hover:bg-white/10 transition-colors md:p-8">
                    <span className="flex-shrink-0 rounded-sm border border-signature-cream bg-signature-cream px-3 py-1 text-center font-mono text-[14px] font-medium text-signature-forest w-20">
                      {t.year}
                    </span>
                    <p className="font-sans text-[15px] font-normal leading-[1.45] text-white">{t.text}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="py-24 md:py-24" view-transition-name="about-achievements">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12">
            <div className="mb-12 max-w-3xl">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
                Excellence
              </span>
              <h2 className="mb-4 font-display text-[32px] font-normal leading-[1.2] text-ink md:text-[40px]">
                Student Achievements
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {ACHIEVEMENTS.map((a, i) => (
                <ScrollReveal key={i} variant="scaleIn" delay={i * 0.15}>
                  <div
                    className={`rounded-sm p-8 md:p-10 ${i === 0 ? 'bg-signature-peach' : 'bg-signature-mint'}`}
                  >
                    <div className="flex flex-col h-full justify-between gap-12">
                      <div>
                        <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-ink">
                          {a.year} Milestone
                        </span>
                        <h3 className="mb-3 font-display text-[20px] font-normal leading-[1.35] text-ink">{a.title}</h3>
                        <p className="font-sans text-[14px] font-normal leading-[1.45] text-body">{a.desc}</p>
                      </div>
                      <span className="mt-8 block h-10 w-10 rounded-sm bg-ink" />
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
