import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Users, Calendar, Award, ChevronLeft, ChevronRight } from 'lucide-react'

const CAROUSEL_ITEMS = [
  {
    icon: GraduationCap,
    title: 'Smart Attendance',
    description: 'Scan QR codes and track attendance in real time across all classrooms.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'Connect with Batch',
    description: 'View classmates, study groups, and collaborate on projects instantly.',
    color: 'text-coral',
    bg: 'bg-coral/10',
  },
  {
    icon: Calendar,
    title: 'Deadlines & Routine',
    description: 'Stay updated with class schedules, assignment deadlines, and exam dates.',
    color: 'text-deep-green',
    bg: 'bg-deep-green/10',
  },
  {
    icon: Award,
    title: 'Achievements & Placements',
    description: 'Explore department achievements, gallery, and placement opportunities.',
    color: 'text-action-blue',
    bg: 'bg-action-blue/10',
  },
]

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login, user } = useAuth()

  useEffect(() => {
    if (user) {
      if (user.role === 'faculty') navigate('/faculty/dashboard')
      else if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin')
      else navigate('/students')
    }
  }, [user, navigate])

  const successMsg = location.state?.message || ''

  const [tab,      setTab]      = useState('student')
  const [rollNo,   setRollNo]   = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)
  const [slide,    setSlide]    = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(s => (s + 1) % CAROUSEL_ITEMS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const next = () => setSlide(s => (s + 1) % CAROUSEL_ITEMS.length)
  const prev = () => setSlide(s => (s - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    try {
      const payload = tab === 'student'
        ? { rollNumber: rollNo.trim().toUpperCase(), password }
        : { email: email.trim().toLowerCase(), password }

      const user = await login(payload)

      if (user.role === 'faculty') {
        navigate('/faculty/dashboard')
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin')
      } else {
        navigate('/students')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Logo-only header — matches navbar logo position exactly */}
      <div className="fixed left-0 right-0 z-50 flex justify-center px-4 top-4 pointer-events-none">
        <div className="w-full max-w-[1280px] rounded-full px-6 py-2.5 flex items-center pointer-events-auto">
          <div className="flex items-center gap-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display font-bold text-[18px] tracking-tight text-ink">
                Electro Infinity
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row min-h-screen pt-16">
        {/* Left — College Image Panel */}
        <div className="hidden md:flex md:w-1/2 relative bg-ink overflow-hidden">
          <img
            src="/college-login.jpg"
            alt="Electro Infinity"
            className="w-full h-full object-cover opacity-70"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          {/* Fallback gradient background when image is missing */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-ink to-primary/80" />

          {/* Carousel */}
          <div className="absolute bottom-12 left-10 right-10">
            <div className="relative h-40">
              <AnimatePresence mode="wait">
                {CAROUSEL_ITEMS.map((item, idx) => (
                  idx === slide && (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0"
                    >
                      <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center mb-4`}>
                        <item.icon size={24} className={item.color} />
                      </div>
                      <h3 className="font-display text-[22px] font-bold text-white mb-2">{item.title}</h3>
                      <p className="font-sans text-[15px] text-white/80 leading-relaxed max-w-sm">
                        {item.description}
                      </p>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            </div>

            {/* Carousel controls */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1.5">
                {CAROUSEL_ITEMS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right — Login Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 md:py-0 bg-canvas">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            {/* Header */}
            <div className="mb-8">
              <span className="font-mono text-[12px] uppercase tracking-wider text-slate font-semibold block mb-2">
                Secure Authentication
              </span>
              <h1 className="font-display text-[32px] font-bold tracking-tight text-ink">Sign In</h1>
              <p className="font-sans text-[14px] text-body-muted mt-1">
                Access your department dashboard, attendance console, and resources.
              </p>
            </div>

            {/* Success message */}
            {successMsg && (
              <div className="bg-pale-green border border-green-200 rounded-xl px-4 py-3 mb-6 text-[13px] font-medium text-deep-green text-center">
                {successMsg}
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex p-1 rounded-full mb-8 bg-soft-stone border border-hairline">
              <button
                type="button"
                onClick={() => { setTab('student'); setError('') }}
                className={`flex-1 py-2 rounded-full text-[13px] font-sans font-medium transition-all ${
                  tab === 'student'
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'text-body-muted hover:text-ink'
                }`}
              >
                Student Member
              </button>
              <button
                type="button"
                onClick={() => { setTab('admin'); setError('') }}
                className={`flex-1 py-2 rounded-full text-[13px] font-sans font-medium transition-all ${
                  tab === 'admin'
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'text-body-muted hover:text-ink'
                }`}
              >
                Faculty / Admin
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Identifier field */}
              <div>
                <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate mb-1.5 block">
                  {tab === 'student' ? 'Roll Number' : 'Institutional Email'}
                </label>
                {tab === 'student' ? (
                  <input
                    required
                    autoFocus
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value.toUpperCase())}
                    className="input uppercase font-mono"
                    placeholder="e.g. EE24001"
                  />
                ) : (
                  <input
                    required
                    autoFocus
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input"
                    placeholder="faculty@agemc.edu"
                  />
                )}
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-[12px] uppercase tracking-wider font-semibold text-slate block">
                    Password
                  </label>
                  {tab === 'student' && (
                    <Link to="/forgot-password" className="text-[12px] font-medium text-action-blue hover:underline">
                      Forgot?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate hover:text-ink transition-colors text-[13px]"
                  >
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-[13px] font-medium text-error bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="button-primary w-full mt-2 py-3.5"
              >
                {loading ? 'Authenticating…' : 'Sign In →'}
              </button>
            </form>

            {/* Activate account link */}
            {tab === 'student' && (
              <p className="text-[13px] font-sans text-body-muted text-center mt-8 pt-4 border-t border-hairline">
                First time logging in?{' '}
                <Link to="/activate" className="text-action-blue hover:underline font-semibold ml-1">
                  Activate your account
                </Link>
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
