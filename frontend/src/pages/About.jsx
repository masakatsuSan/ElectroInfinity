const TIMELINE = [
  { year: '20XX', text: 'Club founded by a small group of electrical students at AGEMC.' },
  { year: '20XX', text: 'First power electronics workshop run for juniors.' },
  { year: '20XX', text: 'Partnered with the department for guaranteed lab access hours.' },
  { year: '2026', text: 'Electro Infinity website and digital resource hub launched.' },
]

const OBJECTIVES = [
  'Run hands-on workshops beyond the syllabus.',
  'Give members real lab time and real project ownership.',
  'Build a peer network for internships and placements.',
  'Make AGEMC EE a place students are excited to be part of.',
]

const HIGHLIGHTS = [
  { stat: '150+', label: 'Active Members' },
  { stat: '12',   label: 'Workshops / Year' },
  { stat: '5',    label: 'Labs Access' },
]

export default function About() {
  return (
    <div className="page-wrap pt-32 pb-20 bg-canvas text-ink">
      {/* Heading */}
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        About the Club
      </h2>
      <h1 className="font-display font-semibold text-[clamp(40px,8vw,64px)] leading-tight tracking-normal mb-8 text-ink">
        Electro Infinity
      </h1>
      <p className="font-sans text-[21px] font-normal leading-relaxed text-ink-muted-80 max-w-[640px] mb-20">
        The student-run technical society for the Electrical Engineering branch at AGEMC
        — running workshops, lab sessions and projects alongside the core MAKAUT B.Tech
        curriculum.
      </p>

      {/* History */}
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        History
      </h2>
      <h2 className="font-display font-semibold text-[32px] leading-tight tracking-normal mb-8 text-ink">
        Our Story
      </h2>



      <div className="flex flex-col mb-16">
        {TIMELINE.map((t, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr] gap-6 py-6 border-b border-divider-soft first:border-t">
            <span className="font-sans text-[17px] font-semibold text-primary">{t.year}</span>
            <p className="font-sans text-[17px] font-normal text-ink-muted-80 leading-relaxed">{t.text}</p>
          </div>
        ))}
      </div>
      <p className="font-sans text-[12px] font-medium text-ink-muted-48 uppercase tracking-widest mb-20">
        Placeholder — replace with real dates
      </p>

      {/* Objectives */}
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        Goals
      </h2>
      <h2 className="font-display font-semibold text-[32px] leading-tight tracking-normal mb-8 text-ink">
        Objectives
      </h2>

      <ul className="flex flex-col mb-20 max-w-[640px]">
        {OBJECTIVES.map((o, i) => (
          <li key={i} className="flex items-start gap-6 py-5 border-b border-divider-soft first:border-t">
            <span className="font-sans text-[14px] font-semibold text-primary pt-0.5 flex-shrink-0">0{i + 1}</span>
            <span className="font-sans text-[17px] font-normal text-ink-muted-80 leading-relaxed">{o}</span>
          </li>
        ))}
      </ul>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 border-t border-divider-soft py-12">
        {HIGHLIGHTS.map((h, i) => (
          <div key={h.label} className={`flex flex-col ${i > 0 ? 'md:pl-8 md:border-l border-divider-soft' : ''}`}>
            <div className="font-display font-medium text-[48px] text-primary leading-none mb-2">
              {h.stat}
            </div>
            <div className="font-sans text-[14px] font-semibold uppercase tracking-widest text-ink-muted-80">
              {h.label}
            </div>
          </div>
        ))}
      </div>

      {/* Lab Photos */}
      <div className="border-t border-divider-soft pt-16 mb-20">
        <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
          Infrastructure
        </h2>
        <h2 className="font-display font-semibold text-[32px] leading-tight tracking-normal mb-8 text-ink">
          Lab Photos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Static placeholders, can be connected to admin uploads later */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-video bg-surface-pearl rounded-lg border border-divider-soft flex items-center justify-center">
               <p className="font-sans text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48">Lab Photo {i + 1}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Student Achievements */}
      <div className="border-t border-divider-soft pt-16">
        <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
          Wall of Fame
        </h2>
        <h2 className="font-display font-semibold text-[32px] leading-tight tracking-normal mb-8 text-ink">
          Student Achievements
        </h2>
        <div className="flex flex-col gap-6">
           {/* Static placeholders, can be connected to admin uploads later */}
           <div className="bg-surface-pearl p-6 rounded-lg border border-divider-soft">
             <h3 className="font-display font-semibold text-[20px] mb-2 text-ink">TCS Ninja Placement 2024</h3>
             <p className="font-sans text-[15px] text-ink-muted-80">15 students from the 2024 batch successfully secured placements at TCS.</p>
           </div>
           <div className="bg-surface-pearl p-6 rounded-lg border border-divider-soft">
             <h3 className="font-display font-semibold text-[20px] mb-2 text-ink">Smart India Hackathon Winners</h3>
             <p className="font-sans text-[15px] text-ink-muted-80">Team 'Electro' won first place in the hardware category at SIH 2023.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
