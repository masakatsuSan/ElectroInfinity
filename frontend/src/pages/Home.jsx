import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getNotices } from '../api/notices'
import SEO from '../components/SEO'

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
    <div className="flex justify-center gap-6 md:gap-12">
      {[['d', 'Days'], ['h', 'Hours'], ['m', 'Mins'], ['s', 'Secs']].map(([k, label]) => (
        <div key={k} className="text-center">
          <div className="font-display font-medium text-[36px] md:text-[56px] leading-none text-ink tabular-nums tracking-tight">
            {String(parts[k]).padStart(2, '0')}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-slate mt-2">
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ['notices', { limit: 4 }],
    queryFn: () => getNotices({ limit: 4 }).then(r => r.data),
  })

  const notices = data?.data || []

  return (
    <div className="bg-canvas text-ink">
      <SEO 
        title="Home" 
        description="Electro Infinity — Electrical Engineering Club, Alipurduar Government Engineering and Management College" 
        path="/" 
      />

      {/* ── HERO SECTION (Stark white editorial canvas) ── */}
      <section className="pt-36 md:pt-48 pb-20 md:pb-28 border-b border-hairline">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          
          <div className="max-w-4xl">
            {/* Coral Taxonomy Tag */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-coral"></span>
              <span className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate">
                Electrical Engineering Club · AGEMC
              </span>
            </div>

            {/* Monumental display headline */}
            <h1 className="font-display text-[44px] sm:text-[64px] lg:text-[84px] font-normal leading-[1.02] tracking-[-0.03em] text-ink mb-8">
              Where engineering curiosity turns into real power.
            </h1>

            <p className="font-sans text-[18px] sm:text-[20px] text-body-muted leading-[1.4] max-w-2xl mb-10">
              The official hub for circuit design, power systems, hands-on automation labs, and peer-to-peer engineering research at AGEMC.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/attendance/student" className="button-primary">
                📷 Scan Attendance QR
              </Link>
              <Link to="/attendance/faculty" className="button-secondary">
                ⚡ Faculty Console
              </Link>
              <Link to="/courses" className="button-pill-outline">
                Explore Courses →
              </Link>
            </div>
          </div>

          {/* Hero Media Composition: Dark Agent Console Card & Stone Info Card */}
          <div className="grid md:grid-cols-12 gap-6 mt-16 md:mt-24">
            
            {/* Agent console module */}
            <div className="md:col-span-8 bg-primary text-white rounded-2xl p-8 md:p-10 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="font-mono text-[12px] uppercase tracking-wider text-slate">Live Department Platform</span>
                  </div>
                  <span className="font-mono text-[12px] text-muted">v2.4.0-stable</span>
                </div>

                <h3 className="font-display text-[26px] md:text-[34px] font-normal tracking-tight text-white mb-3">
                  Dynamic Geofenced Attendance & Academic Management
                </h3>
                <p className="font-sans text-black text-[15px] text-muted leading-relaxed max-w-xl">
                  Real-time classroom presence verification anchored to faculty devices with 15-second rotating security tokens and batch-isolated coursework.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between text-[13px] font-mono text-slate">
                <span>✓ 100m GPS Verification</span>
                <span>✓ Anti-Proxy QR Rotation</span>
                <span>✓ Batch Scoping</span>
              </div>
            </div>

            {/* Soft Stone Capability Card */}
            <div className="md:col-span-4 bg-soft-stone rounded-2xl p-8 flex flex-col justify-between border border-hairline">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate font-bold block mb-3">
                  Academic Focus
                </span>
                <h4 className="font-display text-[22px] font-bold text-ink mb-3">
                  Theory to Lab Prototype
                </h4>
                <p className="font-sans text-[14px] text-body-muted leading-relaxed">
                  Power Electronics, Digital Signal Processing, Renewable Energy Systems, and Microcontrollers.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-hairline">
                <Link to="/laboratory" className="font-sans text-[14px] font-medium text-action-blue hover:underline">
                  View Laboratory Facilities →
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── DARK ENTERPRISE FEATURE BAND (#003c33 Deep Green) ── */}
      <section className="bg-deep-green text-white py-24 md:py-32">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="max-w-3xl mb-16">
            <span className="font-mono text-[12px] uppercase tracking-wider text-coral-soft font-semibold block mb-3">
              Core Pillars
            </span>
            <h2 className="font-display text-[36px] md:text-[48px] font-normal leading-tight tracking-tight text-white">
              Built for engineering rigor, practical mastery, and research collaboration.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-white/10 rounded-2xl p-8 bg-black/20 backdrop-blur-sm">
              <span className="font-mono text-[13px] text-coral-soft font-bold block mb-4">01. WORKSHOPS</span>
              <h3 className="font-display text-[22px] font-bold text-white mb-2">Hands-on Hardware</h3>
              <p className="font-sans text-[15px] text-white/80 leading-relaxed">
                Practical sessions on PCB design, embedded systems, transformer testing, and power grid simulation.
              </p>
            </div>

            <div className="border border-white/10 rounded-2xl p-8 bg-black/20 backdrop-blur-sm">
              <span className="font-mono text-[13px] text-coral-soft font-bold block mb-4">02. ATTENDANCE</span>
              <h3 className="font-display text-[22px] font-bold text-white mb-2">Precision Attendance</h3>
              <p className="font-sans text-[15px] text-white/80 leading-relaxed">
                Seamless GPS verification anchoring faculty and students with zero paperwork and instant analytics.
              </p>
            </div>

            <div className="border border-white/10 rounded-2xl p-8 bg-black/20 backdrop-blur-sm">
              <span className="font-mono text-[13px] text-coral-soft font-bold block mb-4">03. CAREER</span>
              <h3 className="font-display text-[22px] font-bold text-white mb-2">Placement & Alumni</h3>
              <p className="font-sans text-[15px] text-white/80 leading-relaxed">
                Direct mentorship from alumni in core electrical, semiconductor, and automation industries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEXT EVENT COUNTDOWN (Warm Stone Surface) ── */}
      <section className="py-20 md:py-28 bg-soft-stone border-b border-hairline">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 text-center">
          <span className="font-mono text-[12px] uppercase tracking-wider text-slate font-semibold block mb-2">
            Upcoming Department Workshop
          </span>
          <h2 className="font-display text-[32px] md:text-[44px] font-bold tracking-tight text-ink mb-4">
            Workshop on Smart Grid & Microcontrollers
          </h2>
          <p className="font-sans text-[16px] text-body-muted max-w-lg mx-auto mb-10">
            Live simulation on MATLAB/Simulink and hardware interfacing with ESP32 and industrial sensors.
          </p>

          <div className="mb-10">
            <Countdown targetDate="2026-09-20T10:00:00" />
          </div>

          <Link to="/events" className="button-primary">
            View Schedule & Register →
          </Link>
        </div>
      </section>

      {/* ── LATEST NOTICES (Research-table style) ── */}
      <section className="py-20 md:py-28 bg-canvas">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 pb-4 border-b border-hairline">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
                Official Bulletins
              </span>
              <h2 className="font-display text-[32px] md:text-[40px] font-bold tracking-tight text-ink">
                Department Notices
              </h2>
            </div>
            <Link to="/resources" className="button-pill-outline text-[14px]">
              View All Bulletins →
            </Link>
          </div>

          <div className="border border-hairline rounded-2xl overflow-hidden shadow-card">
            {isLoading ? (
              <div className="p-12 text-center text-slate">Loading announcements…</div>
            ) : notices.length > 0 ? (
              <div className="divide-y divide-hairline">
                {notices.map(n => (
                  <div key={n._id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-soft-stone/40 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-pale-green text-deep-green border border-green-200 flex-shrink-0">
                        {n.category || 'Academic'}
                      </span>
                      <h3 className="font-sans text-[16px] font-semibold text-ink truncate">{n.title}</h3>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-mono text-[12px] text-slate">
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <Link to="/resources" className="text-[13px] font-medium text-action-blue hover:underline">
                        Read →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate">No recent notices published.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
