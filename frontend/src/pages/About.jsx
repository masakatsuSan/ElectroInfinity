import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'

const TIMELINE = [
  { year: '2023', text: 'Seniors of the electrical engineering students at AGEMC start sharing notes and PYQs in group chats.' },
  { year: '2024', text: 'First hands-on Power Electronics & Hardware Automation workshops run for juniors.' },
  { year: '2025', text: 'Materials consolidated into shared folders as seniors handed down lab manuals and references.' },
  { year: '2026', text: 'Electro Infinity launched: an unofficial, open-source resource and community app built by seniors, dedicated to their juniors.' },
]

const OBJECTIVES = [
  'Run hands-on workshops beyond the syllabus with industry-grade kits.',
  'Make lab references and equipment guides easy for juniors to find.',
  'Build a strong alumni peer network for internships and core placements.',
  'Keep every resource freely open to every batch, with no paywall and no gatekeeping.',
]

const HIGHLIGHTS = [
  { stat: '150+', label: 'Students Reached', desc: 'Across 4 undergraduate batches' },
  { stat: '12+',  label: 'Workshops & Seminars / Year', desc: 'Hardware & software simulations' },
  { stat: '5',    label: 'Laboratories Covered', desc: 'Power, Machines, DSP, Circuits, Drives' },
]

const ACHIEVEMENTS = [
  { year: '2026', title: 'Summer Internship at POWERGRID', desc: 'Completed a summer internship at POWERGRID\'s ±800 kV HVDC Substation, gaining practical exposure to HVDC systems, protection, control, switchyards, and converter technology.' },
  { year: '2026', title: 'Internship at URSC, ISRO', desc: 'Completed an internship at UR Rao Satellite Centre, ISRO, working on derating analysis of actuator power units for space applications.' },
]

export default function About() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <SEO
        title="About Us | Electro Infinity"
        description="Electro Infinity is an independent, unofficial, open-source student project for AGEMC Electrical Engineering. Not affiliated with the college."
        path="/about"
      />

      <ScrollReveal variant="fadeUp">
        <section className="pt-24 pb-24 md:pt-32 md:pb-24" view-transition-name="about-hero">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12">
            <div className="max-w-3xl">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
                An Independent Student Project
              </span>
              <h1 className="mb-5 font-display text-[40px] font-normal leading-[1.15] text-ink md:text-[56px]">
                About Electro Infinity
              </h1>
              <p className="max-w-2xl font-sans text-[18px] font-normal leading-[1.4] text-body">
                A student-built technical hub for Electrical Engineering at Alipurduar Government Engineering &amp;
                Management College &mdash; made by the seniors, dedicated to their juniors.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="pb-24 md:pb-24" view-transition-name="about-disclaimer">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12">
            <div className="max-w-4xl border-2 border-ink bg-white p-7 md:p-10">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-sm bg-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16px] text-white">
                  Disclaimer
                </span>
                <span className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16px] text-muted">
                  Unofficial &amp; Independent
                </span>
                <span className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16px] text-muted">
                  Open Source
                </span>
              </div>

              <p className="font-sans text-[16px] font-medium leading-[1.5] text-ink">
                Electro Infinity is an unofficial student project. It has no official connection to the college.
              </p>

              <ul className="mt-6 space-y-4">
                {[
                  'It is not affiliated with, endorsed by, sponsored by, supervised by, or operated by Alipurduar Government Engineering & Management College (AGEMC), its Electrical Engineering department, any faculty member, or any official college body or administration.',
                  'It is not an official college website, portal, or information system, and it does not speak on behalf of the college, the department, or its students.',
                  'The college name and "AGEMC" are used only to identify the students this app is built for. No college logo, emblem, or seal is used, and nothing here should be read as an official notification, circular, or result.',
                  'All content — announcements, deadlines, routines, calendar entries, faculty and lab listings, resources — is maintained by students for convenience. It may be inaccurate or out of date, and it is not an official communication.',
                  'For anything that actually matters, verify with the college or the department through official channels at agemc.ac.in.',
                  'This project is free and open source. Use it, learn from it, fork it for your own department, and contribute back.',
                ].map(item => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-signature-coral" />
                    <span className="font-sans text-[15px] leading-[1.7] text-body">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fadeUp">
        <section className="py-24 md:py-24" view-transition-name="about-highlights">
          <div className="mx-auto max-w-[1280px] px-6 md:px-12">
            <div className="grid gap-6 cream-callout-card sm:grid-cols-3 md:gap-8">
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
            <div className="max-w-3xl mb-12">
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
                    className="flex items-start gap-5 p-8 transition-colors bg-white border border-divider-soft hover:bg-surface-soft"
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
            <div className="max-w-3xl mb-12">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-muted">
                History & Milestones
              </span>
              <h2 className="mb-4 font-display text-[32px] font-normal leading-[1.2] text-ink md:text-[40px]">
                Our Journey
              </h2>
            </div>

            <div className="overflow-hidden signature-forest-card">
              {TIMELINE.map((t, i) => (
                <ScrollReveal key={i} variant="fadeUp" delay={i * 0.1}>
                  <div className="flex flex-col gap-5 p-6 transition-colors border-b border-white/20 last:border-b-0 sm:flex-row sm:items-center hover:bg-white/10 md:p-8">
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
            <div className="max-w-3xl mb-12">
              <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral">
                Excellence
              </span>
              <h2 className="mb-4 font-display text-[32px] font-normal leading-[1.2] text-ink md:text-[40px]">
                2026 Milestones
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {ACHIEVEMENTS.map((a, i) => (
                <ScrollReveal key={i} variant="scaleIn" delay={i * 0.15}>
                  <div className={`flex flex-col h-full rounded-sm p-8 md:p-10 ${i === 0 ? 'bg-signature-peach' : 'bg-signature-mint'}`}>
                    <div className="flex flex-col justify-between h-full gap-12">
                      <div>
                        <span className="mb-3 block font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-ink">
                          2026 MILESTONE
                        </span>
                        <h3 className="mb-3 font-display text-[20px] font-normal leading-[1.35] text-ink">{a.title}</h3>
                        <p className="font-sans text-[14px] font-normal leading-[1.45] text-body">{a.desc}</p>
                      </div>
                      <span className="block w-10 h-10 mt-8 rounded-sm bg-ink" />
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
