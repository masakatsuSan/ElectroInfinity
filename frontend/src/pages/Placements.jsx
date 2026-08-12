// Phase 4: Placements page
// These arrays should eventually be moved to MongoDB + admin panel
// For now they're static — easy to update directly in this file

const STATS = [
  { n: '78%',   l: 'Placement Rate 2025' },
  { n: '32',    l: 'Companies Visited'   },
  { n: '₹4.2L', l: 'Avg. Package'        },
]

const RECRUITERS = [
  { name:'WBSEDCL',   role:'Junior Engineer (Electrical)',  placed: 12 },
  { name:'CESC',      role:'Assistant Engineer',            placed: 8  },
  { name:'Tata Power',role:'Graduate Engineer Trainee',     placed: 5  },
  { name:'ABB India', role:'Field Service Engineer',        placed: 4  },
  { name:'L&T Power', role:'Site Engineer',                 placed: 6  },
  { name:'NTPC',      role:'Executive Trainee',             placed: 3  },
]

const INTERNSHIPS = [
  { title:'Electrical Engineering Intern', company:'WBSEDCL, Alipurduar Division', stipend:'₹8,000/month',  deadline:'2026-07-30' },
  { title:'Power System Intern',           company:'Tata Power, North Bengal',      stipend:'₹10,000/month', deadline:'2026-08-15' },
  { title:'Control System Intern',         company:'ABB India — Remote + Onsite',   stipend:'₹12,000/month', deadline:'2026-07-20' },
]

const ALUMNI = [
  { initials:'RD', name:'Rahul Das',     role:'Junior Engineer, WBSEDCL', desc:'Managing distribution grid for Alipurduar district. Selected via WBSEDCL 2024 recruitment.', batch:'2020–2024' },
  { initials:'PS', name:'Priya Sharma',  role:'GET, NTPC Farakka',        desc:'GATE 2024 qualified with AIR 1100. Working on thermal plant operations.', batch:'2020–2024' },
  { initials:'AR', name:'Aditya Roy',    role:'M.Tech Student, NIT Durgapur', desc:'Full scholarship in Power Systems. GATE score 720.', batch:'2019–2023' },
]

export default function Placements() {
  return (
    <div className="page-wrap pt-28 pb-20 min-h-screen">
      <span className="eyebrow">Career & Industry</span>
      <h1 className="font-display font-black text-[clamp(36px,8vw,64px)] leading-none tracking-tight mb-4">
        Placements
      </h1>
      <p className="text-[14.5px] opacity-65 max-w-[520px] leading-relaxed mb-10">
        From AGEMC lab benches to the energy grids, substations and control rooms of India's power sector.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-white/7 border border-white/7 mb-16">
        {STATS.map(s => (
          <div key={s.l} className="bg-bg py-7 px-4 text-center">
            <div className="font-display font-black text-[clamp(24px,5vw,40px)] text-vs leading-none">{s.n}</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-40 mt-2">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Recruiters */}
      <span className="eyebrow block mb-2">Recruiters</span>
      <h2 className="font-display font-bold text-[22px] tracking-tight mb-5">Companies that hire from us</h2>
      <div className="flex flex-col mb-14">
        {RECRUITERS.map(r => (
          <div key={r.name} className="flex items-center gap-4 py-4 border-b border-white/7 first:border-t first:border-white/7">
            <div className="w-11 h-11 border border-white/10 flex items-center justify-center font-display font-bold text-vs text-[13px] flex-shrink-0">
              {r.name.slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-medium">{r.name}</p>
              <p className="text-[12.5px] opacity-55 mt-0.5">{r.role}</p>
            </div>
            <span className="font-mono text-[10.5px] text-green flex-shrink-0">{r.placed} placed</span>
          </div>
        ))}
      </div>

      {/* Internships */}
      <span className="eyebrow block mb-2">Internships</span>
      <h2 className="font-display font-bold text-[22px] tracking-tight mb-5">Current Opportunities</h2>
      <div className="flex flex-col mb-14">
        {INTERNSHIPS.map(i => (
          <div key={i.title} className="flex items-start gap-4 py-5 border-b border-white/7 first:border-t first:border-white/7">
            <div className="w-11 h-11 border border-white/10 flex items-center justify-center flex-shrink-0 text-vs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-medium">{i.title}</p>
              <p className="text-[12.5px] opacity-55 mt-0.5">{i.company}</p>
              <p className="font-mono text-[10.5px] text-green mt-1">{i.stipend} · Apply by {i.deadline}</p>
            </div>
            <a href="#" className="text-[12.5px] font-semibold text-vs border-b border-vs pb-px hover:text-white hover:border-white transition-colors flex-shrink-0 self-center">
              Apply →
            </a>
          </div>
        ))}
      </div>

      {/* Alumni */}
      <span className="eyebrow block mb-2">Alumni</span>
      <h2 className="font-display font-bold text-[22px] tracking-tight mb-5">Success Stories</h2>
      <div className="flex flex-col">
        {ALUMNI.map(a => (
          <div key={a.name} className="grid grid-cols-[auto_1fr] gap-4 py-5 border-b border-white/7 first:border-t first:border-white/7">
            <div className="w-12 h-12 rounded-full bg-violet/12 flex items-center justify-center font-display font-black text-vs text-[16px] flex-shrink-0">
              {a.initials}
            </div>
            <div>
              <p className="font-display font-bold text-[16px] tracking-tight">{a.name}</p>
              <p className="text-[13px] opacity-65 mt-0.5 leading-relaxed">{a.role}<br />{a.desc}</p>
              <p className="font-mono text-[9.5px] text-vs mt-1.5 uppercase tracking-wider">{a.batch}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
