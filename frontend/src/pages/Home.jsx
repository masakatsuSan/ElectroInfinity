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
    <div className="bg-canvas text-ink">
      <SEO 
        title="Home" 
        description="Electro Infinity — Electrical Engineering Club, Alipurduar Government Engineering and Management College" 
        path="/" 
      />

      {/* ── HERO SECTION (Stark white editorial canvas) ── */}
      <section className="pb-20 border-b pt-36 md:pt-48 md:pb-28 border-hairline">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          
          <div className="max-w-4xl">
            {/* Coral Taxonomy Tag */}
            <div className="inline-flex items-center gap-2 mb-6">
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
                 Scan Attendance QR
              </Link>
              <Link to="/attendance/faculty" className="button-secondary">
                Faculty Console
              </Link>
              <Link to="/courses" className="button-pill-outline">
                Explore Courses →
              </Link>
            </div>
          </div>

          {/* Hero Media Composition: Dark Agent Console Card & Stone Info Card */}
          <div className="grid gap-6 mt-16 md:grid-cols-12 md:mt-24">
            
            {/* Agent console module */}
            <div className="flex flex-col justify-between p-8 text-white md:col-span-8 bg-primary rounded-2xl md:p-10 shadow-card">
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
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

                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 text-white items-center justify-between text-[13px] font-mono text-slate">
                  <span><Check size={14} /> 50m GPS Verification</span>
                  <span><Check size={14} /> Anti-Proxy QR Rotation</span>
                  <span><Check size={14} /> Batch Scoping</span>
                </div>
            </div>

            {/* Soft Stone Capability Card */}
            <div className="flex flex-col justify-between p-8 border md:col-span-4 bg-soft-stone rounded-2xl border-hairline">
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

              <div className="pt-4 mt-6 border-t border-hairline">
                <Link to="/laboratory" className="font-sans text-[14px] font-medium text-action-blue hover:underline">
                  View Laboratory Facilities →
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── DARK ENTERPRISE FEATURE BAND (#003c33 Deep Green) ── */}
      <section className="py-24 text-white bg-deep-green md:py-32">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="max-w-3xl mb-16">
            <span className="font-mono text-[12px] uppercase tracking-wider text-coral-soft font-semibold block mb-3">
              Core Pillars
            </span>
            <h2 className="font-display text-[36px] md:text-[48px] font-normal leading-tight tracking-tight text-white">
              Built for engineering rigor, practical mastery, and research collaboration.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-8 border border-white/10 rounded-2xl bg-black/20 backdrop-blur-sm">
              <span className="font-mono text-[13px] text-coral-soft font-bold block mb-4">01. WORKSHOPS</span>
              <h3 className="font-display text-[22px] font-bold text-white mb-2">Hands-on Hardware</h3>
              <p className="font-sans text-[15px] text-white/80 leading-relaxed">
                Practical sessions on PCB design, embedded systems, transformer testing, and power grid simulation.
              </p>
            </div>

            <div className="p-8 border border-white/10 rounded-2xl bg-black/20 backdrop-blur-sm">
              <span className="font-mono text-[13px] text-coral-soft font-bold block mb-4">02. ATTENDANCE</span>
              <h3 className="font-display text-[22px] font-bold text-white mb-2">Precision Attendance</h3>
              <p className="font-sans text-[15px] text-white/80 leading-relaxed">
                Seamless GPS verification anchoring faculty and students with zero paperwork and instant analytics.
              </p>
            </div>

            <div className="p-8 border border-white/10 rounded-2xl bg-black/20 backdrop-blur-sm">
              <span className="font-mono text-[13px] text-coral-soft font-bold block mb-4">03. CAREER</span>
              <h3 className="font-display text-[22px] font-bold text-white mb-2">Placement & Alumni</h3>
              <p className="font-sans text-[15px] text-white/80 leading-relaxed">
                Direct mentorship from alumni in core electrical, semiconductor, and automation industries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST ANNOUNCEMENTS (Research-table style) ── */}
      <section className="py-20 md:py-28 bg-canvas">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12">
          <div className="flex flex-col justify-between gap-4 pb-4 mb-12 border-b sm:flex-row sm:items-end border-hairline">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
                Official Communications
              </span>
              <h2 className="font-display text-[32px] md:text-[40px] font-bold tracking-tight text-ink">
                Latest Announcements
              </h2>
            </div>
            <Link to="/announcements" className="button-pill-outline text-[14px]">
              View All Announcements →
            </Link>
          </div>

          <div className="overflow-hidden border border-hairline rounded-2xl shadow-card">
            {isLoading ? (
              <div className="p-12 text-center text-slate">Loading announcements…</div>
            ) : announcements.length > 0 ? (
              <div className="divide-y divide-hairline">
                {announcements.map(a => (
                  <div key={a._id} className="flex flex-col justify-between gap-4 p-5 transition-colors md:p-6 sm:flex-row sm:items-center hover:bg-soft-stone/40">
                    <div className="flex items-center min-w-0 gap-4">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-pale-green text-deep-green border border-green-200 flex-shrink-0">
                        {a.category || 'general'}
                      </span>
                      <h3 className="font-sans text-[16px] font-semibold text-ink truncate">{a.title}</h3>
                    </div>

                    <div className="flex items-center flex-shrink-0 gap-4">
                      <span className="font-mono text-[12px] text-slate">
                        {new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <Link to="/announcements" className="text-[13px] font-medium text-action-blue hover:underline">
                        Read →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate">No announcements published yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}