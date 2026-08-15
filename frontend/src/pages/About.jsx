import SEO from '../components/SEO'
import { Link } from 'react-router-dom'

const TIMELINE = [
  { year: '2023', text: 'Club established by electrical engineering students and faculty mentors at AGEMC.' },
  { year: '2024', text: 'Conducted first hands-on Power Electronics & Hardware Automation workshops for undergraduates.' },
  { year: '2025', text: 'Partnered with department laboratories for guaranteed hardware testbed access.' },
  { year: '2026', text: 'Launched Electro Infinity unified digital attendance and academic resource command center.' },
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
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="About Us | Electro Infinity"
        description="Learn more about Electro Infinity, the official Electrical Engineering Club of AGEMC."
        path="/about"
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">

        {/* ── HERO ── */}
        <div className="max-w-3xl mb-16">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            The Technical Society
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            About Electro Infinity
          </h1>
          <p className="font-sans text-[18px] text-body-muted leading-relaxed">
            The official student-led technical hub for Electrical Engineering at Alipurduar Government Engineering & Management College.
          </p>
        </div>

        {/* ── HIGHLIGHTS (Soft stone cards) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-20">
          {HIGHLIGHTS.map(h => (
            <div
              key={h.label}
              className="bg-soft-stone border border-hairline rounded-2xl p-8 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="font-display font-bold text-[48px] leading-none text-ink mb-3">
                  {h.stat}
                </div>
                <div className="font-sans text-[15px] font-bold text-ink mb-1">{h.label}</div>
              </div>
              <p className="font-sans text-[13px] text-body-muted">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* ── OBJECTIVES & MISSION ── */}
        <div className="mb-20">
          <span className="font-mono text-[12px] uppercase tracking-wider text-deep-green font-semibold block mb-2">
            Our Mission
          </span>
          <h2 className="font-display text-[32px] font-bold tracking-tight text-ink mb-8">
            Core Objectives
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {OBJECTIVES.map((o, i) => (
              <div
                key={i}
                className="border border-hairline bg-canvas rounded-2xl p-6 flex gap-4 items-start shadow-card hover:bg-soft-stone/30 transition-colors"
              >
                <span className="font-mono text-[13px] font-bold text-coral flex-shrink-0 pt-0.5">
                  0{i + 1}.
                </span>
                <p className="font-sans text-[15px] text-ink font-medium leading-relaxed">{o}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── TIMELINE ── */}
        <div className="mb-20">
          <span className="font-mono text-[12px] uppercase tracking-wider text-slate font-semibold block mb-2">
            History & Milestones
          </span>
          <h2 className="font-display text-[32px] font-bold tracking-tight text-ink mb-8">
            Our Journey
          </h2>

          <div className="border border-hairline bg-canvas rounded-2xl overflow-hidden shadow-card divide-y divide-hairline">
            {TIMELINE.map((t, i) => (
              <div key={i} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-soft-stone/20 transition-colors">
                <span className="font-mono text-[14px] font-bold text-deep-green bg-pale-green px-3 py-1 rounded-md border border-green-200 w-20 text-center flex-shrink-0">
                  {t.year}
                </span>
                <p className="font-sans text-[15px] text-ink font-medium">{t.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ACHIEVEMENTS ── */}
        <div>
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Excellence
          </span>
          <h2 className="font-display text-[32px] font-bold tracking-tight text-ink mb-8">
            Student Achievements
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {ACHIEVEMENTS.map((a, i) => (
              <div
                key={i}
                className="border border-hairline bg-canvas rounded-2xl p-8 shadow-card flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-[12px] text-slate font-bold uppercase block mb-2">
                    {a.year} Milestone
                  </span>
                  <h3 className="font-display text-[20px] font-bold text-ink mb-2">{a.title}</h3>
                  <p className="font-sans text-[14px] text-body-muted leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
