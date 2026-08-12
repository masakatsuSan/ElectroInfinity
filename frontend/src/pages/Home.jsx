import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getNotices } from '../api/notices'
import NoticeCard from '../components/NoticeCard'

// ── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(phrases) {
  const [text, setText] = useState('')
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = phrases[phaseIdx]
    const timeout = deleting
      ? setTimeout(() => {
          setText(t => t.slice(0, -1))
          if (text.length === 1) {
            setDeleting(false)
            setPhaseIdx(i => (i + 1) % phrases.length)
          }
        }, 36)
      : setTimeout(() => {
          setText(phrase.slice(0, text.length + 1))
          if (text.length === phrase.length - 1) {
            setTimeout(() => setDeleting(true), 1400)
          }
        }, 62)
    return () => clearTimeout(timeout)
  }, [text, deleting, phaseIdx, phrases])

  return text
}

// ── Stats count-up ───────────────────────────────────────────────────────────
function StatNum({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 1100)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(target * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{val}{suffix}</span>
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const typeText = useTypewriter([
    'Built by students.',
    'For students.',
    'Powered by curiosity.',
  ])

  const { data, isLoading } = useQuery({
    queryKey: ['notices', { limit: 4 }],
    queryFn: () => getNotices({ limit: 4 }).then(r => r.data),
  })

  const notices = data?.data || []

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <div>
      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col justify-center pt-32 pb-0 relative overflow-hidden bg-canvas">
        {/* Abstract Gradient Background & Orbital Lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl opacity-50"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-gray-500/10 to-transparent blur-3xl opacity-50"></div>
          
          {/* Orbital Lines */}
          <svg className="absolute w-[800px] h-[800px] md:w-[1200px] md:h-[1200px] opacity-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.2">
            <circle cx="50" cy="50" r="30" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="45" strokeDasharray="1 3" />
            <circle cx="50" cy="50" r="60" strokeDasharray="4 2" />
          </svg>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="page-wrap relative z-10 text-center flex flex-col items-center w-full px-4"
        >
          {/* Main heading */}
          <motion.h1 variants={itemVariants} className="font-display font-medium text-[clamp(48px,8vw,80px)] leading-[0.95] tracking-[-0.03em] text-ink mb-6">
            Electro Infinity.
          </motion.h1>

          <motion.h2 variants={itemVariants} className="font-display font-medium text-[clamp(21px,3vw,28px)] leading-snug tracking-[-0.01em] text-ink-muted-80 mb-6 max-w-2xl">
            The Official Electrical Engineering Club of AGEMC.
          </motion.h2>

          {/* Typewriter */}
          <motion.p variants={itemVariants} className="font-sans text-[18px] font-[450] leading-relaxed text-ink mb-12 min-h-[28px]">
            {typeText}
            <span className="inline-block w-[2px] h-[19px] bg-primary ml-[2px] align-middle animate-pulse" />
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 mb-20">
            <Link to="/login" className="button-primary">
              Login & Register
            </Link>
            <Link to="/about" className="button-secondary-pill">
              Learn more
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="w-full max-w-[1000px] mt-4 rounded-[40px] overflow-hidden bg-surface-pearl border border-divider-soft shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative">
             <div className="aspect-[16/9] w-full bg-gradient-to-tr from-[#141413]/5 to-[#141413]/10 flex flex-col items-center justify-center p-8">
                <span className="font-display font-medium text-ink tracking-[-0.02em] text-[28px] mb-3">Welcome to the Future of Electrical Engineering</span>
                <span className="font-sans text-ink-muted-80 text-[16px] font-[450]">Experience hands-on projects, workshops, and peer collaboration.</span>
             </div>
             
             {/* Satellite CTA */}
             <div className="satellite-cta">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
             </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── NEXT EVENT countdown (Ink Tile) ── */}
      <section data-nav-theme="dark" className="bg-ink py-32 text-canvas ">
        <div className="page-wrap text-center flex flex-col items-center">
          <h2 className="font-display font-medium text-[48px] leading-tight tracking-[-0.02em] mb-4">
            Next Event
          </h2>
          <p className="font-sans text-[20px] font-[450] text-canvas/80 mb-12">
            Workshop on Smart Grid Technologies
          </p>
          <div className="mb-12">
            <Countdown targetDate="2026-07-15T10:00:00" />
          </div>
          <Link to="/contact" className="button-secondary-pill !bg-canvas !text-ink">
            Reserve a seat
          </Link>
        </div>
      </section>

      {/* ── VISION & MISSION (Light Canvas Tile) ── */}
      <section className="bg-canvas py-32 text-ink text-center border-b border-divider-soft">
        <div className="page-wrap flex flex-col items-center">
          <h2 className="font-display font-medium text-[48px] leading-tight tracking-[-0.02em] mb-16">
            Vision & Mission
          </h2>
          <div className="grid md:grid-cols-2 gap-16 max-w-[1000px] text-left">
            <div className="bg-surface-pearl rounded-[40px] p-10 md:p-14 border border-divider-soft">
              <h3 className="font-sans text-[20px] font-bold text-ink uppercase tracking-[0.04em] mb-6">Vision</h3>
              <p className="font-sans text-[16px] font-[450] leading-relaxed text-ink-muted-80">
                To be AGEMC's home base for students who'd rather build a circuit than just
                study one — bridging classroom theory and hands-on power, control and
                automation work.
              </p>
            </div>
            <div className="bg-surface-pearl rounded-[40px] p-10 md:p-14 border border-divider-soft">
              <h3 className="font-sans text-[20px] font-bold text-ink uppercase tracking-[0.04em] mb-6">Mission</h3>
              <ul className="space-y-5">
                {[
                  'Run hands-on workshops beyond the syllabus.',
                  'Get members real lab time and project ownership.',
                  'Build a peer network into internships and placements.',
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 font-sans text-[16px] font-[450] leading-relaxed text-ink-muted-80">
                    <span className="text-ink font-bold">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST NOTICES (White Tile) ── */}
      <section className="bg-canvas py-32">
        <div className="page-wrap text-center flex flex-col items-center">
          <h2 className="font-display font-medium text-[48px] leading-tight tracking-[-0.02em] text-ink mb-6">
            Announcements
          </h2>
          <Link to="/resources" className="text-link flex items-center justify-center gap-1 font-sans text-[16px] font-medium mb-16">
            View all notices 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>

          <div className="w-full max-w-[1000px] grid gap-8 md:grid-cols-2 text-left">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface-pearl rounded-[32px] p-[32px] border border-divider-soft animate-pulse h-[140px]"></div>
              ))
            ) : notices.length > 0 ? (
              notices.map(n => (
                <div key={n._id} className="bg-surface-pearl rounded-[32px] p-[32px] border border-divider-soft flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                   <h3 className="font-sans text-[18px] font-medium text-ink tracking-tight line-clamp-2 mb-4">{n.title}</h3>
                   <div className="flex justify-between items-center mt-4 pt-4 border-t border-divider-soft">
                     <span className="font-sans text-[14px] text-ink-muted-80 font-medium">{new Date(n.createdAt).toLocaleDateString()}</span>
                     <Link to={`/resources`} className="button-secondary-pill !px-4 !py-1 !text-[14px]">View</Link>
                   </div>
                </div>
              ))
            ) : (
              <p className="col-span-full font-sans text-[16px] text-ink-muted-80 text-center">No notices yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Countdown component ──────────────────────────────────────────────────────
function Countdown({ targetDate }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      let diff = Math.max(0, new Date(targetDate) - new Date())
      const d = Math.floor(diff / 86400000); diff -= d * 86400000
      const h = Math.floor(diff / 3600000);  diff -= h * 3600000
      const m = Math.floor(diff / 60000);    diff -= m * 60000
      const s = Math.floor(diff / 1000)
      setParts({ d, h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <div className="flex justify-center gap-4 md:gap-8">
      {[['d', 'Days'], ['h', 'Hours'], ['m', 'Mins'], ['s', 'Secs']].map(([k, label]) => (
        <div key={k} className="text-center">
          <div className="font-display font-medium text-[clamp(28px,6vw,48px)] leading-none text-ink tabular-nums">
            {String(parts[k]).padStart(2, '0')}
          </div>
          <div className="font-sans text-[12px] font-normal tracking-tightest text-ink-muted-80 mt-1">
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Removed InfinityCanvas and CircuitDivider ──────────────────────────────
